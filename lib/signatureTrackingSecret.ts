/** HMAC key for signature click tokens — same as Better Auth (no separate env var). */
export function getSignatureTrackingSecret(): string {
  return (process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || '').trim();
}
