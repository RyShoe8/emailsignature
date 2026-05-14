function stripHtmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(div|p|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Copies rich HTML to the clipboard (Gmail / Outlook paste). */
export async function copyHtmlToClipboard(html: string): Promise<void> {
  const plain = stripHtmlToPlainText(html);

  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    throw new Error('Clipboard is not available');
  }

  try {
    const item = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plain], { type: 'text/plain' }),
    });
    await navigator.clipboard.write([item]);
  } catch {
    await navigator.clipboard.writeText(html);
  }
}

export function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
