import getClientPromise from './mongodb';
import type { User } from './models';
import type { SignatureOrgSettings } from './models';

const DB_NAME = process.env.MONGODB_DB_NAME || 'emailsignature';

export async function getDb() {
  const client = await getClientPromise();
  return client.db(DB_NAME);
}

export async function getUsersCollection() {
  const db = await getDb();
  return db.collection<User>('users');
}

export async function getSignatureSettingsCollection() {
  const db = await getDb();
  return db.collection<SignatureOrgSettings>('signatureSettings');
}
