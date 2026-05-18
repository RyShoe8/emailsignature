/** Gmail send-as signature HTML limit (characters). */
export const GMAIL_SIGNATURE_MAX_CHARS = 10_000;

/**
 * Slim signature HTML for Gmail API upload.
 * Strips markup Gmail ignores or that wastes the 10k character budget.
 */
export function prepareSignatureHtmlForGmail(html: string): string {
  let out = html;

  out = out.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  out = out.replace(/<link\b[^>]*\/?>/gi, '');
  out = out.replace(
    /<tr\b[^>]*\bsig-blocks-stacked-row\b[^>]*>[\s\S]*?<\/tr>/gi,
    ''
  );
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
