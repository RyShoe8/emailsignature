/** Gmail send-as signature HTML limit (characters). */
export const GMAIL_SIGNATURE_MAX_CHARS = 10_000;

const GMAIL_DESKTOP_BLOCK_CLASSES = ['sig-blocks-desktop', 'sig-blocks-stack'] as const;

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
  out = collapseWhitespaceBetweenTags(out);
  return out.trim();
}

/** Last-resort size reduction when still over 10k after base prep (drops stacked promos). */
function applyGmailSizeFallbacks(html: string): string {
  let out = html;
  if (out.length <= GMAIL_SIGNATURE_MAX_CHARS) return out;

  out = removeStackedPromoRows(out);
  return out;
}

/**
 * Prepare signature HTML for Gmail API upload.
 * Dashboard preview/copy keep full responsive HTML; Gmail gets stacked promos only.
 */
export function prepareSignatureHtmlForGmail(html: string): string {
  const base = prepareSignatureHtmlBase(html);
  return applyGmailSizeFallbacks(base);
}

export function gmailSignatureCharCount(html: string): number {
  return prepareSignatureHtmlForGmail(html).length;
}

export function assertGmailSignatureWithinLimit(html: string): void {
  const len = gmailSignatureCharCount(html);
  if (len > GMAIL_SIGNATURE_MAX_CHARS) {
    throw new Error(
      `Signature is ${len} characters after Gmail preparation (limit ${GMAIL_SIGNATURE_MAX_CHARS.toLocaleString()}). Remove promo blocks, switch template, or simplify content.`
    );
  }
}
