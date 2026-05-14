/** Public origin for resolving `/images/...` and relative asset URLs in signatures (Vercel env). */
export function getPublicSiteOrigin(): string | undefined {
  const v = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  return v || undefined;
}

/**
 * Origin used to absolutize `/email-assets/...` (social icons, etc.) in rendered signature HTML.
 * In the browser, falls back to `window.location.origin` so previews match the current tab (HTTPS,
 * non-default ports, Vercel preview URLs). On the server, uses public env or `http://localhost:3000`.
 */
export function getSignatureAssetOrigin(): string {
  const fromEnv = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '')
    .trim()
    .replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    return fromEnv || window.location.origin;
  }
  return fromEnv || 'http://localhost:3000';
}

/** Derive `https://host` from incoming request headers (Vercel sets `x-forwarded-*`). */
export function getRequestSiteOrigin(headers: { get(name: string): string | null }): string | undefined {
  const host = headers.get('x-forwarded-host') || headers.get('host');
  if (!host) return undefined;
  const proto = (headers.get('x-forwarded-proto') || 'https').split(',')[0].trim();
  const hostname = host.split(',')[0].trim();
  return `${proto}://${hostname}`;
}
