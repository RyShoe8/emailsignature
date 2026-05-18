import type {
  RenderSignatureInput,
  SignatureBrand,
  SignatureProfile,
  SignatureTemplate,
  SignatureElement,
  ContentBlockData,
} from './types';
import { STANDARD_SIGNATURE_TEMPLATE } from './templates/standard';
import { STACKED_SIGNATURE_TEMPLATE } from './templates/stacked';
import { CORPORATE_SIGNATURE_TEMPLATE } from './templates/corporate';
import { PROFESSIONAL_SIGNATURE_TEMPLATE } from './templates/professional';
import {
  SOCIAL_ICON_DISCORD,
  SOCIAL_ICON_FACEBOOK,
  SOCIAL_ICON_INSTAGRAM,
  SOCIAL_ICON_LINKEDIN,
  SOCIAL_ICON_REDDIT,
} from './socialIcons';

type ElementType = SignatureElement['type'];

function hasElement(elements: SignatureElement[], type: ElementType): boolean {
  return elements.some((e) => e.type === type);
}

/** Fallback when publicSiteOrigin is not passed (local dev). Set NEXT_PUBLIC_SITE_URL in production. */
const DEFAULT_PUBLIC_SITE_ORIGIN = 'http://localhost:3000';

function stripTrailingSlash(u: string): string {
  return u.replace(/\/+$/, '');
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

/** Link label when a list row has a URL but no title (hostname, else "Link"). */
function listItemLinkFallbackLabel(rawUrl: string): string {
  const t = rawUrl.trim();
  if (!t) return 'Link';
  try {
    const u = new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`);
    return u.hostname.replace(/^www\./i, '');
  } catch {
    return 'Link';
  }
}

function listItemHasBody(it: {
  title?: string;
  description?: string;
  url?: string;
}): boolean {
  return Boolean(
    (it.title || '').trim() || (it.description || '').trim() || (it.url || '').trim()
  );
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
        const innerOpen = result.slice(nextIf).match(/^\{\{#if\s+[\w]+\s*\}\}/);
        i = nextIf + (innerOpen?.[0].length ?? 5);
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

function buildContentBlockParts(blocks: ContentBlockData[], origin: string): string[] {
  const enabled = blocks.filter((b) => b.enabled).slice(0, 2);
  if (enabled.length === 0) return [];

  const parts: string[] = [];

  for (const block of enabled) {
    if (block.type === 'book_a_call') {
      const title = escapeHtml((block.callTitle || 'Book a Call').trim());
      const url = escapeHtml((block.callUrl || '#').trim());
      const btnText = escapeHtml((block.callButtonText || 'Schedule Now').trim());
      parts.push(`<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:12px;" width="100%">
  <tr><td style="font-size:12px;font-weight:700;color:#333;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${title}</td></tr>
  <tr><td style="padding:0;">
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="border-collapse:collapse;">
      <tr>
        <td align="center" valign="middle" style="background-color:{{primaryColor}};border-radius:4px;padding:8px 18px;">
          <a href="${url}" style="color:#ffffff;font-size:12px;font-weight:600;text-decoration:none;display:inline-block;line-height:1.3;">${btnText}</a>
        </td>
      </tr>
    </table>
  </td></tr>
</table>`);
    } else if (block.type === 'latest_blogs') {
      const items = (block.rssItems || []).slice(0, 3);
      if (items.length === 0) continue;
      let itemsHtml = '';
      for (const item of items) {
        const itemTitle = escapeHtml((item.title || '').trim());
        const itemUrl = escapeHtml((item.url || '#').trim());
        itemsHtml += `<tr><td style="padding:0 0 6px 0;font-size:12px;line-height:1.4;">
  <a href="${itemUrl}" style="color:#333;text-decoration:none;font-weight:500;">${itemTitle}</a>
</td></tr>`;
      }
      parts.push(`<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:12px;" width="100%">
  <tr><td style="font-size:12px;font-weight:700;color:#333;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">Latest Posts</td></tr>
  ${itemsHtml}
</table>`);
    } else if (block.type === 'list') {
      const title = escapeHtml((block.listTitle || '').trim());
      const items = (block.listItems || []).filter(listItemHasBody).slice(0, 4);
      if (!title && items.length === 0) continue;
      let inner = '';
      if (title) {
        inner += `<tr><td style="font-size:12px;font-weight:700;color:#333;padding-bottom:6px;text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${title}</td></tr>`;
      }
      for (const item of items) {
        const titleTrim = (item.title || '').trim();
        const itemDesc = item.description ? escapeHtml(item.description.trim()) : '';
        const itemUrl = item.url ? item.url.trim() : '';
        const boldLabelRaw =
          titleTrim || (itemUrl ? listItemLinkFallbackLabel(itemUrl) : '');
        const boldEscaped = escapeHtml(boldLabelRaw);
        let titleHtml = '';
        if (itemUrl && boldLabelRaw) {
          titleHtml = `<a href="${escapeHtml(itemUrl)}" style="color:#333;text-decoration:none;font-weight:600;">${boldEscaped}</a>`;
        } else if (boldLabelRaw) {
          titleHtml = `<span style="color:#333;font-weight:600;">${boldEscaped}</span>`;
        }
        const descHtml = itemDesc
          ? `<div style="color:#666;font-size:11px;line-height:1.4;margin-top:2px;">${itemDesc}</div>`
          : '';
        if (!titleHtml && !descHtml) continue;
        inner += `<tr><td style="padding:0 0 6px 0;font-size:12px;line-height:1.4;">${titleHtml}${descHtml}</td></tr>`;
      }
      parts.push(`<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:12px;" width="100%">${inner}</table>`);
    } else if (block.type === 'image') {
      const imageUrl = (block.imageUrl || '').trim();
      if (!imageUrl) continue;
      const absImg = escapeHtml(ensureAbsolutePublicUrl(normalizeImageUrl(imageUrl), origin));
      const linkUrl = (block.imageLinkUrl || '').trim();
      const imgTag = `<img src="${absImg}" width="200" border="0" alt="" style="display:block;max-width:200px;width:200px;height:auto;border:0;outline:none;text-decoration:none;border-radius:4px;" />`;
      const wrapped = linkUrl
        ? `<a href="${escapeHtml(linkUrl)}" style="text-decoration:none;border:0;outline:none;display:inline-block;">${imgTag}</a>`
        : imgTag;
      parts.push(`<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:12px;" width="100%">
  <tr><td style="padding:0;line-height:0;font-size:0;">${wrapped}</td></tr>
</table>`);
    } else if (block.type === 'custom') {
      // Legacy fallback: render saved `custom` blocks so existing data keeps working.
      // We deliberately skip the old "Learn more ->" trailing row; if the block has a URL
      // and no image, the title itself becomes the link.
      const rawTitle = (block.customTitle || '').trim();
      const title = escapeHtml(rawTitle);
      const text = escapeHtml((block.customText || '').trim());
      const url = block.customUrl?.trim() || '';
      const imageUrl = block.customImageUrl?.trim() || '';
      let html = '';
      if (title) {
        const titleInner =
          url && !imageUrl
            ? `<a href="${escapeHtml(url)}" style="color:#333;text-decoration:none;">${title}</a>`
            : title;
        html += `<tr><td style="font-size:12px;font-weight:700;color:#333;padding-bottom:4px;text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">${titleInner}</td></tr>`;
      }
      if (imageUrl) {
        const absImg = escapeHtml(ensureAbsolutePublicUrl(normalizeImageUrl(imageUrl), origin));
        const imgTag = `<img src="${absImg}" width="200" border="0" alt="" style="display:block;max-width:200px;width:200px;height:auto;border:0;outline:none;text-decoration:none;border-radius:4px;" />`;
        if (url) {
          html += `<tr><td style="padding:0 0 4px 0;line-height:0;font-size:0;"><a href="${escapeHtml(url)}" style="text-decoration:none;border:0;outline:none;display:inline-block;">${imgTag}</a></td></tr>`;
        } else {
          html += `<tr><td style="padding:0 0 4px 0;line-height:0;font-size:0;">${imgTag}</td></tr>`;
        }
      }
      if (text) {
        html += `<tr><td style="font-size:12px;color:#555;line-height:1.4;padding-bottom:4px;">${text}</td></tr>`;
      }
      if (html) {
        parts.push(`<table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:12px;" width="100%">${html}</table>`);
      }
    }
  }

  return parts;
}

/**
 * Render content blocks for side-column (desktop) and stacked (mobile/Gmail) layouts.
 */
function renderContentBlocksHtml(
  blocks: ContentBlockData[],
  origin: string
): { desktop: string; stacked: string } {
  const parts = buildContentBlockParts(blocks, origin);
  if (parts.length === 0) return { desktop: '', stacked: '' };

  const stacked = parts.join('');
  if (parts.length === 1) return { desktop: parts[0]!, stacked };

  const [left, right] = parts;
  const desktop = `<table class="sig-content-blocks-grid" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;">
<tr>
<td class="sig-content-block-cell sig-content-block-cell-left" valign="top" width="50%" style="vertical-align:top;width:50%;">${left}</td>
<td class="sig-content-block-cell sig-content-block-cell-right" valign="top" width="50%" style="vertical-align:top;width:50%;border-top:1px solid #e5e5e5;">${right}</td>
</tr>
</table>`;
  return { desktop, stacked };
}

/**
 * Append UTM parameters to http/https links in rendered HTML.
 * Skips mailto:, tel:, and anchor-only (#) links.
 */
function appendUtmParams(
  html: string,
  utm: { source: string; medium: string; campaign: string }
): string {
  const params = `utm_source=${encodeURIComponent(utm.source)}&utm_medium=${encodeURIComponent(utm.medium)}&utm_campaign=${encodeURIComponent(utm.campaign)}`;

  return html.replace(/href="(https?:\/\/[^"]+)"/gi, (_match, url: string) => {
    try {
      const separator = url.includes('?') ? '&' : '?';
      return `href="${url}${separator}${params}"`;
    } catch {
      return _match;
    }
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
  const hasAddressEl = hasElement(elements, 'address');
  const hasAnimationEl = hasElement(elements, 'animation');
  const hasContentBlocksEl = hasElement(elements, 'contentBlocks');

  const useAnimation =
    hasAnimationEl &&
    Boolean(brand.animation?.enabled) &&
    Boolean(brand.animation?.gifUrl?.trim());

  const rawLogoUrl = useAnimation ? brand.animation!.gifUrl!.trim() : brand.logoUrl.trim();
  const logoUrl = normalizeImageUrl(ensureAbsolutePublicUrl(rawLogoUrl, origin));

  const website = normalizeWebsite(brand.website);
  // Display value strips the protocol so it reads cleanly as "example.com" while the
  // href stays a fully qualified URL.
  const websiteDisplay = website
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
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
    } else {
      logoDisplayHeightStr = '';
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
  const reddit =
    hasSocial && brand.socialLinks.reddit?.trim()
      ? brand.socialLinks.reddit.trim()
      : '';
  const discord =
    hasSocial && brand.socialLinks.discord?.trim()
      ? brand.socialLinks.discord.trim()
      : '';

  const addressLine =
    hasAddressEl && brand.address?.trim() ? brand.address.trim() : '';
  const stateLine = hasAddressEl && brand.state?.trim() ? brand.state.trim() : '';
  const zipLine = hasAddressEl && brand.zip?.trim() ? brand.zip.trim() : '';

  const showSocialBlock = hasSocial && Boolean(linkedin || facebook || instagram || reddit || discord);

  let socialTdLiStyle = '';
  let socialTdFbStyle = '';
  let socialTdIgStyle = '';
  let socialTdRedditStyle = '';
  let socialTdDiscordStyle = '';
  if (linkedin) {
    socialTdLiStyle =
      facebook || instagram || reddit || discord
        ? 'padding:0 6px 0 0;vertical-align:middle;'
        : 'padding:0;vertical-align:middle;';
  }
  if (facebook) {
    socialTdFbStyle = instagram || reddit || discord
      ? 'padding:0 6px 0 0;vertical-align:middle;'
      : 'padding:0;vertical-align:middle;';
  }
  if (instagram) {
    socialTdIgStyle = reddit || discord
      ? 'padding:0 6px 0 0;vertical-align:middle;'
      : 'padding:0;vertical-align:middle;';
  }
  if (reddit) {
    socialTdRedditStyle = discord
      ? 'padding:0 6px 0 0;vertical-align:middle;'
      : 'padding:0;vertical-align:middle;';
  }
  if (discord) {
    socialTdDiscordStyle = 'padding:0;vertical-align:middle;';
  }

  const showAddressBlock = hasAddressEl && Boolean(addressLine || stateLine || zipLine);
  const addressBlockLines: string[] = [];
  if (addressLine) addressBlockLines.push(escapeHtml(addressLine));
  const stateZipLine = [stateLine, zipLine].filter(Boolean).join(' ');
  if (stateZipLine) addressBlockLines.push(escapeHtml(stateZipLine));
  const addressBlockHtml = addressBlockLines.join('<br/>');

  const officePhoneRaw = profile.officePhone?.trim() ?? '';
  const mobilePhoneRaw = profile.mobilePhone?.trim() ?? '';
  const officePhone = hasContact && officePhoneRaw ? officePhoneRaw : '';
  const mobilePhone = hasContact && mobilePhoneRaw ? mobilePhoneRaw : '';
  const officePhoneTelHref = officePhone ? telHref(officePhone) : '';
  const mobilePhoneTelHref = mobilePhone ? telHref(mobilePhone) : '';

  // Content blocks
  const contentBlocks = brand.contentBlocks?.filter((b) => b.enabled) ?? [];
  const hasContentBlocks = hasContentBlocksEl && contentBlocks.length > 0;
  const contentBlocksRendered = hasContentBlocks
    ? renderContentBlocksHtml(contentBlocks, origin)
    : { desktop: '', stacked: '' };
  const useVerticalBlocksOnly = template.layout === 'stacked';
  const contentBlocksHtml = useVerticalBlocksOnly
    ? contentBlocksRendered.stacked
    : contentBlocksRendered.desktop;
  const contentBlocksHtmlStacked = contentBlocksRendered.stacked;

  /** Standard layout: optional third column for blocks (stacked keeps blocks below). */
  const sideColumnContentBlocks =
    template.layout !== 'stacked' && hasContentBlocks;
  const signatureRootColspan =
    template.layout === 'standard' && hasContentBlocks ? '3' : '2';

  const evalCtx: Record<string, string | boolean | undefined> = {
    hasLogo,
    hasName,
    hasTitle,
    hasContact,
    hasDivider,
    hasOfficePhone: Boolean(officePhone),
    hasMobilePhone: Boolean(mobilePhone),
    showSocialBlock,
    showAddressBlock,
    hasLinkedin: Boolean(linkedin),
    hasFacebook: Boolean(facebook),
    hasInstagram: Boolean(instagram),
    hasReddit: Boolean(reddit),
    hasDiscord: Boolean(discord),
    hasLogoSizedHeight,
    hasLogoAutoHeight,
    hasContentBlocks,
    sideColumnContentBlocks,
    hasWebsite: Boolean(website),
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
    companyName: escapeHtml(brand.companyName.trim()),
    website: escapeHtml(website),
    websiteDisplay: escapeHtml(websiteDisplay),
    linkedin: escapeHtml(linkedin),
    facebook: escapeHtml(facebook),
    instagram: escapeHtml(instagram),
    reddit: escapeHtml(reddit),
    discord: escapeHtml(discord),
    addressBlockHtml,
    iconLinkedin: normalizeImageUrl(ensureAbsolutePublicUrl(SOCIAL_ICON_LINKEDIN, origin)),
    iconFacebook: normalizeImageUrl(ensureAbsolutePublicUrl(SOCIAL_ICON_FACEBOOK, origin)),
    iconInstagram: normalizeImageUrl(ensureAbsolutePublicUrl(SOCIAL_ICON_INSTAGRAM, origin)),
    iconReddit: normalizeImageUrl(ensureAbsolutePublicUrl(SOCIAL_ICON_REDDIT, origin)),
    iconDiscord: normalizeImageUrl(ensureAbsolutePublicUrl(SOCIAL_ICON_DISCORD, origin)),
    socialTdLiStyle,
    socialTdFbStyle,
    socialTdIgStyle,
    socialTdRedditStyle,
    socialTdDiscordStyle,
    contentBlocksHtml,
    contentBlocksHtmlStacked,
    signatureRootColspan,
  };

  return { evalCtx, stringCtx };
}

function pickTemplate(layout: SignatureTemplate['layout']): string {
  if (layout === 'stacked') return STACKED_SIGNATURE_TEMPLATE;
  if (layout === 'corporate') return CORPORATE_SIGNATURE_TEMPLATE;
  if (layout === 'professional') return PROFESSIONAL_SIGNATURE_TEMPLATE;
  return STANDARD_SIGNATURE_TEMPLATE;
}

export function renderSignature(input: RenderSignatureInput): string {
  const { profile, brand, template, publicSiteOrigin, utm } = input;
  const origin = stripTrailingSlash(
    (publicSiteOrigin ?? DEFAULT_PUBLIC_SITE_ORIGIN).trim() || DEFAULT_PUBLIC_SITE_ORIGIN
  );
  const tmpl = pickTemplate(template.layout);
  const { evalCtx, stringCtx } = mergeRenderContext(profile, brand, template, origin);
  const afterIf = processConditionals(tmpl, evalCtx);
  let html = substituteVariables(afterIf, stringCtx);

  // Append UTM parameters when configured
  if (utm) {
    html = appendUtmParams(html, utm);
  }

  // Inject Google Fonts stylesheet if applicable
  const primaryFont = (brand.fontFamily || '').split(',')[0].replace(/['"]/g, '').trim();
  const googleFonts = new Set([
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway', 'Nunito', 
    'Work Sans', 'DM Sans', 'Manrope', 'Rubik', 'Outfit', 'Merriweather', 'Playfair Display', 'PT Serif'
  ]);
  
  if (googleFonts.has(primaryFont)) {
    const formattedFontName = primaryFont.replace(/\s+/g, '+');
    const fontLink = `<link href="https://fonts.googleapis.com/css2?family=${formattedFontName}:wght@400;500;600;700&display=swap" rel="stylesheet" />\n`;
    html = fontLink + html;
  }

  return html;
}
