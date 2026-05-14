/** Public origin for resolving `/images/...` and relative asset URLs in signatures (Vercel env). */
export function getPublicSiteOrigin(): string | undefined {
  const v = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  return v || undefined;
}
