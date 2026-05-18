/** Gmail send-as signature HTML limit (characters). */
export const GMAIL_SIGNATURE_MAX_CHARS = 10_000;

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

/** Classes used for desktop-only promo columns (removed for Gmail). */
const GMAIL_DESKTOP_BLOCK_CLASSES = ['sig-blocks-desktop', 'sig-blocks-stack'] as const;

/**
 * Slim signature HTML for Gmail API upload.
 * Strips markup Gmail ignores or that wastes the 10k character budget.
 * Keeps the mobile stacked promo row; removes desktop side columns.
 */
export function prepareSignatureHtmlForGmail(html: string): string {
  let out = html;

  out = out.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  out = out.replace(/<link\b[^>]*\/?>/gi, '');

  for (const cls of GMAIL_DESKTOP_BLOCK_CLASSES) {
    out = removeSignatureElementsByClass(out, cls, 'td');
  }

  out = out.replace(/>\s+</g, '><');

  return out.trim();
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
