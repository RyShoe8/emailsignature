import type {
  RenderSignatureInput,
  SignatureBrand,
  SignatureProfile,
  SignatureTemplate,
  SignatureElement,
} from './types';
import { STANDARD_SIGNATURE_TEMPLATE } from './templates/standard';
import { STACKED_SIGNATURE_TEMPLATE } from './templates/stacked';
import {
  SOCIAL_ICON_FACEBOOK,
  SOCIAL_ICON_INSTAGRAM,
  SOCIAL_ICON_LINKEDIN,
} from './socialIcons';

type ElementType = SignatureElement['type'];

function hasElement(elements: SignatureElement[], type: ElementType): boolean {
  return elements.some((e) => e.type === type);
}

function normalizeWebsite(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function normalizeImageUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (!/^https?:\/\//i.test(t)) return t.replace(/ /g, '%20');

  try {
    const url = new URL(t);
    const normalizedPath = url.pathname
      .split('/')
      .map((segment) => {
        if (!segment) return segment;
        try {
          return encodeURIComponent(decodeURIComponent(segment));
        } catch {
          return encodeURIComponent(segment);
        }
      })
      .join('/');
    url.pathname = normalizedPath;
    return url.toString();
  } catch {
    return t.replace(/ /g, '%20');
  }
}

function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, '');
  return digits ? `tel:${digits}` : `tel:${phone.trim()}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isTruthy(ctx: Record<string, string | boolean | undefined>, key: string): boolean {
  const v = ctx[key];
  if (v === undefined || v === null || v === false) return false;
  if (typeof v === 'string') return v.trim() !== '';
  return Boolean(v);
}

/**
 * Resolves {{#if key}}...{{/if}} with optional nesting.
 */
function processConditionals(
  template: string,
  evalCtx: Record<string, string | boolean | undefined>
): string {
  const openRe = /\{\{#if\s+([\w]+)\s*\}\}/;
  let result = template;
  let match = openRe.exec(result);
  while (match) {
    const key = match[1];
    const start = match.index;
    const openEnd = start + match[0].length;
    let depth = 1;
    let i = openEnd;
    let closeStart = -1;
    while (i < result.length && depth > 0) {
      const nextIf = result.indexOf('{{#if', i);
      const nextFi = result.indexOf('{{/if}}', i);
      if (nextFi === -1) break;
      if (nextIf !== -1 && nextIf < nextFi) {
        depth += 1;
        i = nextIf + 5;
      } else {
        depth -= 1;
        if (depth === 0) {
          closeStart = nextFi;
          break;
        }
        i = nextFi + 8;
      }
    }
    if (closeStart === -1) break;
    const closeEnd = closeStart + '{{/if}}'.length;
    const inner = result.slice(openEnd, closeStart);
    const keep = isTruthy(evalCtx, key);
    const replacement = keep ? processConditionals(inner, evalCtx) : '';
    result = result.slice(0, start) + replacement + result.slice(closeEnd);
    match = openRe.exec(result);
  }
  return result;
}

function substituteVariables(html: string, strings: Record<string, string>): string {
  return html.replace(/\{\{([\w]+)\}\}/g, (_, key: string) => {
    const v = strings[key];
    return v !== undefined ? v : '';
  });
}

export function mergeRenderContext(
  profile: SignatureProfile,
  brand: SignatureBrand,
  template: SignatureTemplate
): {
  evalCtx: Record<string, string | boolean | undefined>;
  stringCtx: Record<string, string>;
} {
  const { elements } = template;
  const hasLogo = hasElement(elements, 'logo');
  const hasName = hasElement(elements, 'name');
  const hasTitle = hasElement(elements, 'title');
  const hasContact = hasElement(elements, 'contact');
  const hasSocial = hasElement(elements, 'social');
  const hasDivider = hasElement(elements, 'divider');
  const hasLocations = hasElement(elements, 'locations');
  const hasWarehouseEl = hasElement(elements, 'warehouse');
  const hasAnimationEl = hasElement(elements, 'animation');

  const useAnimation =
    hasAnimationEl &&
    Boolean(brand.animation?.enabled) &&
    Boolean(brand.animation?.gifUrl?.trim());

  const rawLogoUrl = useAnimation ? brand.animation!.gifUrl!.trim() : brand.logoUrl.trim();
  const logoUrl = normalizeImageUrl(rawLogoUrl);

  const website = normalizeWebsite(brand.website);

  const linkedin =
    hasSocial && brand.socialLinks.linkedin?.trim()
      ? brand.socialLinks.linkedin.trim()
      : '';
  const facebook =
    hasSocial && brand.socialLinks.facebook?.trim()
      ? brand.socialLinks.facebook.trim()
      : '';
  const instagram =
    hasSocial && brand.socialLinks.instagram?.trim()
      ? brand.socialLinks.instagram.trim()
      : '';

  const dallas =
    hasLocations && brand.locations.dallas?.trim()
      ? brand.locations.dallas.trim()
      : '';
  const boulder =
    hasLocations && brand.locations.boulder?.trim()
      ? brand.locations.boulder.trim()
      : '';

  const warehouseAddress =
    hasWarehouseEl && brand.warehouseAddress?.trim()
      ? brand.warehouseAddress.trim()
      : '';

  const showSocialBlock = hasSocial && Boolean(linkedin || facebook || instagram);
  const showLocationsLines = hasLocations && Boolean(dallas || boulder);
  const showWarehouseBlock = hasWarehouseEl && Boolean(warehouseAddress);
  const showLocationsRow = showLocationsLines || showWarehouseBlock;

  const officePhoneRaw = profile.officePhone?.trim() ?? '';
  const mobilePhoneRaw = profile.mobilePhone?.trim() ?? '';
  const officePhone = hasContact && officePhoneRaw ? officePhoneRaw : '';
  const mobilePhone = hasContact && mobilePhoneRaw ? mobilePhoneRaw : '';
  const officePhoneTelHref = officePhone ? telHref(officePhone) : '';
  const mobilePhoneTelHref = mobilePhone ? telHref(mobilePhone) : '';

  const evalCtx: Record<string, string | boolean | undefined> = {
    hasLogo,
    hasName,
    hasTitle,
    hasContact,
    hasDivider,
    hasOfficePhone: Boolean(officePhone),
    hasMobilePhone: Boolean(mobilePhone),
    showSocialBlock,
    showLocationsRow,
    showLocationsLines,
    showWarehouseBlock,
    hasLinkedin: Boolean(linkedin),
    hasFacebook: Boolean(facebook),
    hasInstagram: Boolean(instagram),
    hasDallas: Boolean(dallas),
    hasBoulder: Boolean(boulder),
  };

  const stringCtx: Record<string, string> = {
    firstName: escapeHtml(profile.firstName.trim()),
    lastName: escapeHtml(profile.lastName.trim()),
    title: escapeHtml(profile.title.trim()),
    email: escapeHtml(profile.email.trim()),
    officePhone: escapeHtml(officePhone),
    officePhoneTelHref: escapeHtml(officePhoneTelHref),
    mobilePhone: escapeHtml(mobilePhone),
    mobilePhoneTelHref: escapeHtml(mobilePhoneTelHref),
    logoUrl: escapeHtml(logoUrl),
    logoLink: escapeHtml(brand.logoLink.trim()),
    primaryColor: escapeHtml(brand.primaryColor.trim()),
    fontFamily: escapeHtml(brand.fontFamily.trim()),
    website: escapeHtml(website),
    linkedin: escapeHtml(linkedin),
    facebook: escapeHtml(facebook),
    instagram: escapeHtml(instagram),
    dallas: escapeHtml(dallas),
    boulder: escapeHtml(boulder),
    warehouseAddress: escapeHtml(warehouseAddress),
    iconLinkedin: normalizeImageUrl(SOCIAL_ICON_LINKEDIN),
    iconFacebook: normalizeImageUrl(SOCIAL_ICON_FACEBOOK),
    iconInstagram: normalizeImageUrl(SOCIAL_ICON_INSTAGRAM),
  };

  return { evalCtx, stringCtx };
}

function pickTemplate(layout: SignatureTemplate['layout']): string {
  return layout === 'stacked' ? STACKED_SIGNATURE_TEMPLATE : STANDARD_SIGNATURE_TEMPLATE;
}

export function renderSignature(input: RenderSignatureInput): string {
  const { profile, brand, template } = input;
  const tmpl = pickTemplate(template.layout);
  const { evalCtx, stringCtx } = mergeRenderContext(profile, brand, template);
  const afterIf = processConditionals(tmpl, evalCtx);
  return substituteVariables(afterIf, stringCtx);
}
