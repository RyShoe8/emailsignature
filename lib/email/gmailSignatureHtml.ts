/** Gmail send-as signature HTML limit (characters). */
export const GMAIL_SIGNATURE_MAX_CHARS = 10_000;

const GMAIL_DESKTOP_BLOCK_CLASSES = ['sig-blocks-desktop', 'sig-blocks-stack'] as const;

export type GmailSignaturePrepResult = {
  html: string;
  stackedPromosRemoved: boolean;
  charCount: number;
};

/**
 * Remove outer elements whose opening tag includes `className` (word-boundary match).
 * Uses depth counting so nested tables inside the element are removed intact.
 */
export function removeSignatureElementsByClass(
  html: string,
  className: string,
  tagName: 'td' | 'tr' = 'td'
): string {
  const classRe = new RegExp(`\\b${className}\\b`);
  const openRe = new RegExp(`<${tagName}\\b`, 'gi');
  let result = html;
  let searchFrom = 0;

  while (searchFrom < result.length) {
    openRe.lastIndex = searchFrom;
    const openMatch = openRe.exec(result);
    if (!openMatch) break;

    const openStart = openMatch.index;
    const tagEnd = result.indexOf('>', openStart);
    if (tagEnd === -1) break;

    const openTag = result.slice(openStart, tagEnd + 1);
    if (!classRe.test(openTag)) {
      searchFrom = tagEnd + 1;
      continue;
    }

    let depth = 1;
    let pos = tagEnd + 1;
    const lowerTag = tagName.toLowerCase();
    const openTagPrefix = `<${lowerTag}`;
    const closeTagStr = `</${lowerTag}>`;

    while (pos < result.length && depth > 0) {
      const nextOpen = result.toLowerCase().indexOf(openTagPrefix, pos);
      const nextClose = result.toLowerCase().indexOf(closeTagStr, pos);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        const afterOpen = nextOpen + openTagPrefix.length;
        const ch = result[afterOpen];
        if (ch === '>' || ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
          depth++;
        }
        pos = afterOpen;
      } else {
        depth--;
        pos = nextClose + closeTagStr.length;
      }
    }

    if (depth === 0) {
      result = result.slice(0, openStart) + result.slice(pos);
      searchFrom = openStart;
    } else {
      searchFrom = tagEnd + 1;
    }
  }

  return result;
}

function findTagRange(html: string, tagName: string, startIndex: number): { start: number; end: number } | null {
  const openRe = new RegExp(`<${tagName}\\b`, 'i');
  openRe.lastIndex = startIndex;
  const openMatch = openRe.exec(html);
  if (!openMatch) return null;

  const openStart = openMatch.index;
  const tagEnd = html.indexOf('>', openStart);
  if (tagEnd === -1) return null;

  let depth = 1;
  let pos = tagEnd + 1;
  const lowerTag = tagName.toLowerCase();
  const openTagPrefix = `<${lowerTag}`;
  const closeTagStr = `</${lowerTag}>`;

  while (pos < html.length && depth > 0) {
    const nextOpen = html.toLowerCase().indexOf(openTagPrefix, pos);
    const nextClose = html.toLowerCase().indexOf(closeTagStr, pos);
    if (nextClose === -1) return null;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      const afterOpen = nextOpen + openTagPrefix.length;
      const ch = html[afterOpen];
      if (ch === '>' || ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        depth++;
      }
      pos = afterOpen;
    } else {
      depth--;
      pos = nextClose + closeTagStr.length;
    }
  }

  return depth === 0 ? { start: openStart, end: pos } : null;
}

function getTagInnerHtmlAt(html: string, tagName: string, startIndex: number): string {
  const range = findTagRange(html, tagName, startIndex);
  if (!range) return '';
  const openEnd = html.indexOf('>', range.start);
  if (openEnd === -1) return '';
  const closeTag = `</${tagName.toLowerCase()}>`;
  const closeStart = range.end - closeTag.length;
  if (html.slice(closeStart, range.end).toLowerCase() !== closeTag) return '';
  return html.slice(openEnd + 1, closeStart).trim();
}

/** Unwrap Professional stacked promo grey panel table (Gmail-only size savings). */
function flattenProfessionalStackedPromoRow(html: string): string {
  if (!html.includes('sig-prof-card-shell') || !html.includes('sig-blocks-stacked-row')) {
    return html;
  }

  const rowMarker = 'class="sig-blocks-stacked-row"';
  let result = html;
  let searchFrom = 0;
  let iterations = 0;

  while (searchFrom < result.length && iterations < 32) {
    iterations++;
    const markerIdx = result.indexOf(rowMarker, searchFrom);
    if (markerIdx === -1) break;

    const rowStart = result.lastIndexOf('<tr', markerIdx);
    if (rowStart === -1) break;

    const rowRange = findTagRange(result, 'tr', rowStart);
    if (!rowRange) {
      searchFrom = markerIdx + 1;
      continue;
    }

    const rowSlice = result.slice(rowRange.start, rowRange.end);
    if (!/<table[^>]*>[\s\S]*<td[^>]*bgcolor="#f0f4ff"/i.test(rowSlice)) {
      searchFrom = rowRange.end;
      continue;
    }

    const rowInner = getTagInnerHtmlAt(result, 'tr', rowRange.start);
    const outerTdStart = rowInner.search(/<td\b/i);
    if (outerTdStart === -1) {
      searchFrom = rowRange.end;
      continue;
    }

    const tdContent = getTagInnerHtmlAt(rowInner, 'td', outerTdStart);
    const wrapperTableStart = tdContent.search(/<table\b/i);
    if (wrapperTableStart === -1) {
      searchFrom = rowRange.end;
      continue;
    }

    const tableInner = getTagInnerHtmlAt(tdContent, 'table', wrapperTableStart);
    const innerTrStart = tableInner.search(/<tr\b/i);
    if (innerTrStart === -1) {
      searchFrom = rowRange.end;
      continue;
    }

    const trInner = getTagInnerHtmlAt(tableInner, 'tr', innerTrStart);
    const greyTdStart = trInner.search(/<td\b/i);
    if (greyTdStart === -1) {
      searchFrom = rowRange.end;
      continue;
    }

    const greyOpenEnd = trInner.indexOf('>', greyTdStart);
    const greyOpenTag = greyOpenEnd === -1 ? '' : trInner.slice(greyTdStart, greyOpenEnd + 1);
    if (!/f0f4ff/i.test(greyOpenTag)) {
      searchFrom = rowRange.end;
      continue;
    }

    const promoContent = getTagInnerHtmlAt(trInner, 'td', greyTdStart);
    const flattened = `<tr class="sig-blocks-stacked-row"><td colspan="3" style="padding-top:12px;">${promoContent}</td></tr>`;
    result = result.slice(0, rowRange.start) + flattened + result.slice(rowRange.end);
    searchFrom = rowRange.start + flattened.length;
  }

  return result;
}

/** Trim verbose inline styles on Professional grey panels for Gmail size budget. */
function trimProfessionalInlineStyles(html: string): string {
  if (!html.includes('sig-prof-card-shell')) return html;
  return html
    .replace(/background-color:#f0f4ff;border-radius:10px;padding:10px 12px 8px 12px/g, 'background-color:#f0f4ff;padding:8px 10px')
    .replace(/background-color:#f0f4ff;border-radius:10px;padding:10px/g, 'background-color:#f0f4ff;padding:8px')
    .replace(/background-color:#f3f4f6;border-radius:8px;padding:8px 12px/g, 'background-color:#f3f4f6;padding:6px 10px')
    .replace(/border-radius:16px;overflow:hidden;/g, 'border-radius:12px;')
    .replace(/border-collapse:separate;border-spacing:0;max-width:660px;width:100%;border:2px solid/g, 'border-collapse:collapse;width:100%;border:2px solid')
    .replace(/padding:8px 10px 0 10px/g, 'padding:8px 10px 0')
    .replace(/padding:10px 10px 0 10px/g, 'padding:10px 0')
    .replace(/padding:8px 10px 10px 10px/g, 'padding:8px 10px')
    .replace(/display:inline-block;/gi, '');
}

/** Additional minification when Professional + tracking is still over the Gmail limit. */
function aggressiveMinifyForGmail(html: string): string {
  return html
    .replace(/<div style="height:[^"]*">&nbsp;<\/div>/gi, '')
    .replace(/border-collapse:collapse;/gi, '')
    .replace(/\swidth="100%"/gi, '')
    .replace(/alt=""/gi, '');
}

/** Drop redundant presentation attributes and MSO hints for Gmail size budget. */
function minifyGmailSignatureMarkup(html: string): string {
  return html
    .replace(/\s*mso-line-height-rule:exactly;?/gi, '')
    .replace(/\s*outline:none;?/gi, '')
    .replace(/\s*border:0;?/gi, '')
    .replace(/\s*role="presentation"/gi, '')
    .replace(/\s+border="0"/gi, '')
    .replace(/\s+cellpadding="0"/gi, '')
    .replace(/\s+cellspacing="0"/gi, '')
    .replace(/font-family:[^;]+;/gi, '')
    .replace(/letter-spacing:[^;]+;/gi, '')
    .replace(/border-radius:\d+px;?/gi, '')
    .replace(/border:2px solid #e8ecf4;?/gi, '')
    .replace(/background-color:#f0f4ff;background-color:#f0f4ff;/g, 'background-color:#f0f4ff;')
    .replace(/max-width:\d+px;/gi, '')
    .replace(/width:100%;width:100%;/g, 'width:100%;')
    .replace(/;{2,}/g, ';')
    .replace(/style=";+/g, 'style="')
    .replace(/style=""/g, '');
}

function stripStyleBlocks(html: string): string {
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
}

function stripLinkTags(html: string): string {
  return html.replace(/<link\b[^>]*\/?>/gi, '');
}

function collapseWhitespaceBetweenTags(html: string): string {
  return html.replace(/>\s+</g, '><');
}

function removeDesktopPromoColumns(html: string): string {
  let out = html;
  for (const cls of GMAIL_DESKTOP_BLOCK_CLASSES) {
    out = removeSignatureElementsByClass(out, cls, 'td');
  }
  return out;
}

function removeStackedPromoRows(html: string): string {
  return removeSignatureElementsByClass(html, 'sig-blocks-stacked-row', 'tr');
}

/**
 * Gmail prep: stacked promo layout only (Gmail ignores @media).
 * Removes desktop side column; keeps stacked row with vertical promo markup.
 */
function prepareSignatureHtmlBase(html: string): string {
  let out = stripLinkTags(html);
  out = stripStyleBlocks(out);
  out = removeDesktopPromoColumns(out);
  if (out.includes('sig-prof-card-shell')) {
    out = removeSignatureElementsByClass(out, 'sig-prof-accent-row', 'tr');
  }
  if (out.length > GMAIL_SIGNATURE_MAX_CHARS && out.includes('sig-prof-card-shell')) {
    out = compressProfessionalForGmail(out);
    out = stripProfessionalOptionalSections(out);
    out = minifyGmailSignatureMarkup(out);
    out = aggressiveMinifyForGmail(out);
    out = collapseWhitespaceBetweenTags(out);
  }
  out = collapseWhitespaceBetweenTags(out);
  return out.trim();
}

/** Compress Professional markup before dropping stacked promos. */
function compressProfessionalForGmail(html: string): string {
  if (!html.includes('sig-prof-card-shell')) return html;
  let out = flattenProfessionalStackedPromoRow(html);
  out = trimProfessionalInlineStyles(out);
  out = minifyGmailSignatureMarkup(out);
  out = collapseWhitespaceBetweenTags(out);
  return out;
}

/** Strip non-essential Professional footer/address chrome for Gmail size budget. */
function stripProfessionalOptionalSections(html: string): string {
  if (!html.includes('sig-prof-card-shell')) return html;
  let out = html;
  if (out.length <= GMAIL_SIGNATURE_MAX_CHARS) return out;
  out = out.replace(
    /<tr><td colspan="3" style="padding:8px 10px 0 10px;"><table[^>]*><tr><td[^>]*f3f4f6[\s\S]*?<\/tr><\/table><\/td><\/tr>/gi,
    ''
  );
  out = out.replace(
    /<tr><td colspan="3" style="padding:10px 10px 0 10px;"><table[^>]*><tr><td[^>]*height:1px[\s\S]*?<\/tr><\/table><\/td><\/tr>/gi,
    ''
  );
  return out;
}

/** Last-resort size reduction when still over 10k after base prep (drops stacked promos). */
function applyGmailSizeFallbacks(html: string): { html: string; stackedPromosRemoved: boolean } {
  let out = html;
  if (out.length <= GMAIL_SIGNATURE_MAX_CHARS) {
    return { html: out, stackedPromosRemoved: false };
  }

  out = compressProfessionalForGmail(out);
  if (out.length <= GMAIL_SIGNATURE_MAX_CHARS) {
    return { html: out, stackedPromosRemoved: false };
  }

  out = stripProfessionalOptionalSections(out);
  out = minifyGmailSignatureMarkup(out);
  out = aggressiveMinifyForGmail(out);
  out = collapseWhitespaceBetweenTags(out);
  if (out.length <= GMAIL_SIGNATURE_MAX_CHARS) {
    return { html: out, stackedPromosRemoved: false };
  }

  out = aggressiveMinifyForGmail(out);
  if (out.length <= GMAIL_SIGNATURE_MAX_CHARS) {
    return { html: out, stackedPromosRemoved: false };
  }

  const hadStackedPromos = /sig-blocks-stacked-row/i.test(out);
  out = removeStackedPromoRows(out);
  return {
    html: out,
    stackedPromosRemoved: hadStackedPromos,
  };
}

/**
 * Prepare signature HTML for Gmail API upload with metadata.
 * Dashboard preview/copy keep full responsive HTML; Gmail gets stacked promos only.
 */
export function prepareSignatureHtmlForGmailDetailed(html: string): GmailSignaturePrepResult {
  const base = prepareSignatureHtmlBase(html);
  const { html: prepared, stackedPromosRemoved } = applyGmailSizeFallbacks(base);
  return {
    html: prepared,
    stackedPromosRemoved,
    charCount: prepared.length,
  };
}

/**
 * Prepare signature HTML for Gmail API upload.
 * Dashboard preview/copy keep full responsive HTML; Gmail gets stacked promos only.
 */
export function prepareSignatureHtmlForGmail(html: string): string {
  return prepareSignatureHtmlForGmailDetailed(html).html;
}

export function gmailSignatureCharCount(html: string): number {
  return prepareSignatureHtmlForGmailDetailed(html).charCount;
}

export function assertGmailSignatureWithinLimit(html: string): void {
  const { charCount, stackedPromosRemoved } = prepareSignatureHtmlForGmailDetailed(html);
  if (stackedPromosRemoved) {
    throw new Error(
      `Signature exceeds Gmail's ${GMAIL_SIGNATURE_MAX_CHARS.toLocaleString()}-character limit after preparation; promotional blocks were omitted. Remove promo blocks, use a simpler template, shorten content, or disable click tracking.`
    );
  }
  if (charCount > GMAIL_SIGNATURE_MAX_CHARS) {
    throw new Error(
      `Signature is ${charCount} characters after Gmail preparation (limit ${GMAIL_SIGNATURE_MAX_CHARS.toLocaleString()}). Remove promo blocks, switch template, or simplify content.`
    );
  }
}
