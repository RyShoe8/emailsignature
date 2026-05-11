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

/** Fallback when publicSiteOrigin is not passed (local dev). Set NEXT_PUBLIC_SITE_URL in production. */
const DEFAULT_PUBLIC_SITE_ORIGIN = 'http://localhost:3000';
const SIGNATURE_ASSET_ORIGIN = 'https://seniorbydesign.com';

/**
 * Measured from seniorbydesign public/email-assets/sbd-logo.png (true PNG; same pixel dims as legacy asset).
 * Update if the asset is replaced.
 */
const LOGO_SBD_NO_TAGLINE_NATURAL_WIDTH = 371;
const LOGO_SBD_NO_TAGLINE_NATURAL_HEIGHT = 451;
const LOGO_DISPLAY_WIDTH_PX = 110;
const LOGO_SBD_NO_TAGLINE_HEIGHT_AT_110 = Math.round(
  LOGO_DISPLAY_WIDTH_PX * (LOGO_SBD_NO_TAGLINE_NATURAL_HEIGHT / LOGO_SBD_NO_TAGLINE_NATURAL_WIDTH)
);

/**
 * Static logo height at {@link LOGO_DISPLAY_WIDTH_PX}px width when admin does not set logoHeightPx.
 * Canonical SBD asset uses measured aspect ratio; other URLs use the same ratio as a conservative
 * fallback (custom logos: set Logo height in admin until natural dimensions are modeled).
 */
function staticLogoHeightAt110Px(absoluteLogoUrl: string): number {
  if (/(?:email-assets\/sbd-logo|sbd-logo-no-tagline)/i.test(absoluteLogoUrl)) {
    return LOGO_SBD_NO_TAGLINE_HEIGHT_AT_110;
  }
  return LOGO_SBD_NO_TAGLINE_HEIGHT_AT_110;
}

function stripTrailingSlash(u: string): string {
  return u.replace(/\/+$/, '');
}

function canonicalizeSignatureAssetUrl(raw: string): string {
  const absolute = ensureAbsolutePublicUrl(raw, SIGNATURE_ASSET_ORIGIN);
  if (!absolute) return absolute;
  try {
    const u = new URL(absolute);
    const canonical = new URL(SIGNATURE_ASSET_ORIGIN);
    const sameBrandHost =
      u.hostname === canonical.hostname ||
      u.hostname === `www.${canonical.hostname}` ||
      canonical.hostname === `www.${u.hostname}`;
    if (sameBrandHost) {
      u.protocol = canonical.protocol;
      u.host = canonical.host;
      u.hash = '';
    }
    return u.toString();
  } catch {
    return absolute;
  }
}

/**
 * Unwraps Next.js portfolio image proxy URLs so pasted email HTML loads images directly.
 */
export function unwrapImageProxyUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  try {
    if (/^https?:\/\//i.test(t)) {
      const u = new URL(t);
      if (u.pathname.includes('/api/image-proxy')) {
        const inner = u.searchParams.get('url');
        if (inner) return decodeURIComponent(inner);
      }
      return t;
    }
    if (t.startsWith('/api/image-proxy')) {
      const q = t.indexOf('?');
      if (q === -1) return t;
      const params = new URLSearchParams(t.slice(q + 1));
      const inner = params.get('url');
      if (inner) return decodeURIComponent(inner);
    }
    return t;
  } catch {
    return t;
  }
}

/**
 * Resolves relative and protocol-relative URLs to absolute https for email clients.
 */
export function ensureAbsolutePublicUrl(raw: string, origin: string): string {
  const base = stripTrailingSlash(origin.trim() || DEFAULT_PUBLIC_SITE_ORIGIN);
  const t = unwrapImageProxyUrl(raw).trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('//')) return `https:${t}`;
  if (t.startsWith('/')) return `${base}${t}`;
  return t;
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
  template: SignatureTemplate,
  siteOrigin: string = DEFAULT_PUBLIC_SITE_ORIGIN
): {
  evalCtx: Record<string, string | boolean | undefined>;
  stringCtx: Record<string, string>;
} {
  const origin = stripTrailingSlash(siteOrigin.trim() || DEFAULT_PUBLIC_SITE_ORIGIN);
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
  const logoUrlRaw = normalizeImageUrl(ensureAbsolutePublicUrl(rawLogoUrl, origin));
  const logoUrl = /(?:email-assets\/sbd-logo|sbd-logo-no-tagline)/i.test(logoUrlRaw)
    ? normalizeImageUrl(canonicalizeSignatureAssetUrl(logoUrlRaw))
    : logoUrlRaw;

  const website = normalizeWebsite(brand.website);
  const logoLinkForHref =
    brand.logoLink.trim() || website || stripTrailingSlash(origin);

  const explicitLogoH =
    typeof brand.logoHeightPx === 'number' &&
    Number.isFinite(brand.logoHeightPx) &&
    brand.logoHeightPx > 0 &&
    brand.logoHeightPx <= 400;
  const logoHeightPxRounded =
    explicitLogoH && typeof brand.logoHeightPx === 'number'
      ? Math.round(brand.logoHeightPx)
      : 0;

  let logoDisplayHeightStr = '';
  if (hasLogo) {
    if (explicitLogoH) {
      logoDisplayHeightStr = String(logoHeightPxRounded);
    } else if (useAnimation) {
      logoDisplayHeightStr = '';
    } else {
      logoDisplayHeightStr = String(staticLogoHeightAt110Px(logoUrl));
    }
  }
  const hasLogoSizedHeight = hasLogo && logoDisplayHeightStr !== '';
  const hasLogoAutoHeight = hasLogo && logoDisplayHeightStr === '';

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

  let socialTdLiStyle = '';
  let socialTdFbStyle = '';
  let socialTdIgStyle = '';
  if (linkedin) {
    socialTdLiStyle =
      facebook || instagram
        ? 'padding:0 8px 0 0;vertical-align:middle;'
        : 'padding:0;vertical-align:middle;';
  }
  if (facebook) {
    socialTdFbStyle = instagram
      ? 'padding:0 8px 0 0;vertical-align:middle;'
      : 'padding:0;vertical-align:middle;';
  }
  if (instagram) {
    socialTdIgStyle = 'padding:0;vertical-align:middle;';
  }

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
    hasLogoSizedHeight,
    hasLogoAutoHeight,
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
    logoLink: escapeHtml(logoLinkForHref),
    logoWidth: '110',
    logoDisplayHeight: logoDisplayHeightStr,
    primaryColor: escapeHtml(brand.primaryColor.trim()),
    fontFamily: escapeHtml(brand.fontFamily.trim()),
    website: escapeHtml(website),
    linkedin: escapeHtml(linkedin),
    facebook: escapeHtml(facebook),
    instagram: escapeHtml(instagram),
    dallas: escapeHtml(dallas),
    boulder: escapeHtml(boulder),
    warehouseAddress: escapeHtml(warehouseAddress),
    iconLinkedin: normalizeImageUrl(canonicalizeSignatureAssetUrl(SOCIAL_ICON_LINKEDIN)),
    iconFacebook: normalizeImageUrl(canonicalizeSignatureAssetUrl(SOCIAL_ICON_FACEBOOK)),
    iconInstagram: normalizeImageUrl(canonicalizeSignatureAssetUrl(SOCIAL_ICON_INSTAGRAM)),
    socialTdLiStyle,
    socialTdFbStyle,
    socialTdIgStyle,
  };

  return { evalCtx, stringCtx };
}

function pickTemplate(layout: SignatureTemplate['layout']): string {
  return layout === 'stacked' ? STACKED_SIGNATURE_TEMPLATE : STANDARD_SIGNATURE_TEMPLATE;
}

export function renderSignature(input: RenderSignatureInput): string {
  const { profile, brand, template, publicSiteOrigin } = input;
  const origin = stripTrailingSlash(
    (publicSiteOrigin ?? DEFAULT_PUBLIC_SITE_ORIGIN).trim() || DEFAULT_PUBLIC_SITE_ORIGIN
  );
  const tmpl = pickTemplate(template.layout);
  const { evalCtx, stringCtx } = mergeRenderContext(profile, brand, template, origin);
  const afterIf = processConditionals(tmpl, evalCtx);
  return substituteVariables(afterIf, stringCtx);
}
