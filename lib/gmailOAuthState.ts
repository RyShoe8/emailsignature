import crypto from 'crypto';

type Payload = { userId: string; exp: number };

function secret(): string {
  return process.env.BETTER_AUTH_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
}

/** Signed opaque state for Gmail OAuth (CSRF + binds flow to Tailnote user). */
export function signGmailOAuthState(userId: string): string {
  const payload: Payload = { userId, exp: Date.now() + 10 * 60 * 1000 };
  const p = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(p).digest('base64url');
  return `${p}.${sig}`;
}

export function verifyGmailOAuthState(token: string): Payload | null {
  try {
    const [p, sig] = token.split('.');
    if (!p || !sig) return null;
    const expected = crypto.createHmac('sha256', secret()).update(p).digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8')) as Payload;
    if (typeof payload.userId !== 'string' || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
