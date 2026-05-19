/** Public app base URL for emails and absolute asset links. */
export function getAppBaseUrl(): string {
  const url =
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000';
  return url.replace(/\/$/, '');
}
