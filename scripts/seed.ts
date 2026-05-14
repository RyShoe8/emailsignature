/**
 * Seed a demo organization (slug `demo`) with default templates if missing.
 * Run from repo root: npx tsx scripts/seed.ts
 */
import mongoose from 'mongoose';
import { connectMongoose } from '../lib/mongoose';
import { OrganizationModel } from '../models/Organization';
import { seedDefaultTemplates } from '../lib/seedOrgTemplates';

async function main() {
  await connectMongoose();
  const slug = 'demo';
  let org = await OrganizationModel.findOne({ slug });
  if (!org) {
    org = await OrganizationModel.create({
      name: 'Demo organization',
      slug,
      companyName: 'Demo organization',
    });
    await seedDefaultTemplates(org._id);
    console.log('Seeded organization', org._id.toString());
  } else {
    console.log('Demo organization already exists:', org._id.toString());
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
