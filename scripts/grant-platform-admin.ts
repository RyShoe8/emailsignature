/**
 * Grant platform admin (Mongo user document used by Better Auth).
 * Run from repo root: npx tsx scripts/grant-platform-admin.ts [email]
 * Default email: ryanschumacher@themediashop.co
 */
import mongoose from 'mongoose';
import { connectMongoose, getMongoDb } from '../lib/mongoose';
import { AUTH_USER_COLLECTION } from '../lib/auth/platformAdmin';

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  const email = (process.argv[2] || 'ryanschumacher@themediashop.co').trim();
  if (!email) {
    console.error('Usage: npx tsx scripts/grant-platform-admin.ts [email]');
    process.exit(1);
  }
  await connectMongoose();
  const db = getMongoDb();
  const result = await db.collection(AUTH_USER_COLLECTION).updateOne(
    { email: { $regex: new RegExp(`^${escapeRegex(email)}$`, 'i') } },
    { $set: { platformAdmin: true } }
  );
  console.log('Matched:', result.matchedCount, 'Modified:', result.modifiedCount, 'Email:', email);
  if (result.matchedCount === 0) {
    console.warn('No user found with that email. Sign up first, then run again.');
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
