import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';

/** Better Auth Mongo adapter uses the `user` collection with string `id`. */
export async function setUserOrganizationId(userId: string, organizationId: string) {
  await connectMongoose();
  const db = mongoose.connection.db;
  if (!db) throw new Error('Database not connected');
  await db.collection('user').updateOne({ id: userId }, { $set: { organizationId, role: 'owner' } });
}
