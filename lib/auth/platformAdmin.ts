import { connectMongoose, getMongoDb } from '@/lib/mongoose';

/** Better Auth MongoDB adapter default collection for users */
export const AUTH_USER_COLLECTION = 'user';

type AuthUserDoc = {
  id?: string;
  platformAdmin?: boolean;
};

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  await connectMongoose();
  const doc = await getMongoDb()
    .collection<AuthUserDoc>(AUTH_USER_COLLECTION)
    .findOne<AuthUserDoc>({ id: userId });
  return doc?.platformAdmin === true;
}
