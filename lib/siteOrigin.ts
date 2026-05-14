/** Public origin for resolving `/images/...` and relative asset URLs in signatures (Vercel env). */
export function getPublicSiteOrigin(): string | undefined {
  const v = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  return v || undefined;
}

function stripTrailingSlash(u: string): string {
  return u.replace(/\/+$/, '');
}

/** Parse NEXT_PUBLIC_* origin for hostname comparison (add https if scheme omitted). */
function envOriginUrlForHostname(fromEnv: string): URL {
  const t = fromEnv.trim();
  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  return new URL(withScheme);
}

/**
 * Origin used to absolutize `/email-assets/...` (social icons, etc.) in rendered signature HTML.
 * In the browser, falls back to `window.location.origin` so previews match the current tab (HTTPS,
 * non-default ports, Vercel preview URLs). On the server, uses public env or `http://localhost:3000`.
 *
 * When `NEXT_PUBLIC_*` points at another deployment than the current tab (hostname mismatch),
 * the browser uses `window.location.origin` so in-app previews load `/email-assets/*` from this host.
 * A separate CDN host for icons would need its own env (not mixed into APP_URL).
 */
export function getSignatureAssetOrigin(): string {
  const fromEnv = stripTrailingSlash(
    (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim()
  );
  if (typeof window !== 'undefined') {
    if (!fromEnv) return stripTrailingSlash(window.location.origin);
    try {
      if (envOriginUrlForHostname(fromEnv).hostname !== window.location.hostname) {
        return stripTrailingSlash(window.location.origin);
      }
    } catch {
      // keep fromEnv
    }
    return fromEnv;
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
