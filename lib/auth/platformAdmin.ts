import mongoose from 'mongoose';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';

/** Better Auth MongoDB adapter default collection for users */
export const AUTH_USER_COLLECTION = 'user';

type AuthUserDoc = {
  _id?: mongoose.Types.ObjectId;
  id?: string;
  platformAdmin?: boolean;
};

/**
 * Session `user.id` is a hex string; the Better Auth Mongo adapter persists it as `_id` (ObjectId),
 * not a separate `id` field on the document.
 */
export function authUserDbFilterBySessionId(
  userId: string
): { _id: mongoose.Types.ObjectId } | { id: string } | null {
  const trimmed = userId.trim();
  if (!trimmed) return null;
  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const oid = new mongoose.Types.ObjectId(trimmed);
    if (String(oid) === trimmed) return { _id: oid };
  }
  return { id: trimmed };
}

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const filter = authUserDbFilterBySessionId(userId);
  if (!filter) return false;
  await connectMongoose();
  const doc = await getMongoDb()
    .collection<AuthUserDoc>(AUTH_USER_COLLECTION)
    .findOne<AuthUserDoc>(filter);
  return doc?.platformAdmin === true;
}
