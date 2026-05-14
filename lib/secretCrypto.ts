import crypto from 'crypto';

function key32(): Buffer {
  const raw = process.env.GOOGLE_OAUTH_ENCRYPTION_KEY || process.env.BETTER_AUTH_SECRET || '';
  return crypto.createHash('sha256').update(raw).digest();
}

/** AES-256-GCM encrypt for storing OAuth refresh tokens at rest. */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key32(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64url');
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, 'base64url');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key32(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
