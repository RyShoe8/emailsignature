export type PromoUrlPrefix = 'https' | 'www';

export function normalizePromoUrl(
  raw: string | undefined,
  prefix: PromoUrlPrefix = 'https'
): string {
  const t = (raw ?? '').trim();
  if (!t) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(t)) return t;

  let hostPath = t.replace(/^\/+/, '');
  if (prefix === 'www') {
    hostPath = hostPath.replace(/^www\./i, '');
    return `https://www.${hostPath}`;
  }
  hostPath = hostPath.replace(/^www\./i, '');
  return `https://${hostPath}`;
}
