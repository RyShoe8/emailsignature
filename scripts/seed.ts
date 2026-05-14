/**
 * Seed a demo organization with default templates if missing.
 * Run from repo root: npx tsx scripts/seed.ts
 */
import mongoose from 'mongoose';
import { connectMongoose } from '../lib/mongoose';
import { OrganizationModel } from '../models/Organization';
import { seedDefaultTemplates } from '../lib/seedOrgTemplates';

const DEMO_ORG_NAME = 'Demo organization';

async function main() {
  await connectMongoose();
  let org = await OrganizationModel.findOne({ name: DEMO_ORG_NAME });
  if (!org) {
    org = await OrganizationModel.create({
      name: DEMO_ORG_NAME,
      companyName: DEMO_ORG_NAME,
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
