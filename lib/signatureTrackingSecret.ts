/** Secret for HMAC signing of signature click tracking tokens. */
export function getSignatureTrackingSecret(): string {
  return (
    process.env.SIGNATURE_TRACKING_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    ''
  ).trim();
}
