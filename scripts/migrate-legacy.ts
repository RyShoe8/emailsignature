/**
 * One-off: copy legacy `signatureSettings` (scope organization) into a new Organization + default templates.
 * Run: npx tsx scripts/migrate-legacy.ts
 */
import getClientPromise from '../lib/mongodb';
import { connectMongoose } from '../lib/mongoose';
import { OrganizationModel } from '../models/Organization';
import { seedDefaultTemplates } from '../lib/seedOrgTemplates';

async function main() {
  const client = await getClientPromise();
  const dbName = process.env.MONGODB_DB_NAME || 'emailsignature';
  const db = client.db(dbName);
  const legacy = await db.collection('signatureSettings').findOne({ scope: 'organization' });
  if (!legacy?.brand) {
    console.log('No legacy signatureSettings document found.');
    process.exit(0);
  }

  await connectMongoose();
  const slug = 'migrated-legacy';
  let org = await OrganizationModel.findOne({ slug });
  if (!org) {
    const b = legacy.brand as Record<string, unknown>;
    org = await OrganizationModel.create({
      name: String(b.companyName || 'Migrated organization'),
      slug,
      companyName: String(b.companyName || ''),
      website: String(b.website || ''),
      logoUrl: String(b.logoUrl || ''),
      logoLink: String(b.logoLink || ''),
      primaryColor: String(b.primaryColor || '#0a0a0a'),
      fontFamily: String(b.fontFamily || 'Arial'),
      socialLinks: b.socialLinks as object,
      locations: b.locations as object,
      warehouseAddress: b.warehouseAddress as string | undefined,
      animation: b.animation as object | undefined,
    });
    await seedDefaultTemplates(org._id);
    console.log('Created organization', org._id.toString(), 'slug=', slug);
  } else {
    console.log('Organization already exists for migration slug', slug);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
