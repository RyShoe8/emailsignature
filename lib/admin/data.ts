import mongoose from 'mongoose';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import { AUTH_USER_COLLECTION } from '@/lib/auth/platformAdmin';
import { OrganizationModel } from '@/models/Organization';

export type AdminOrgRow = {
  _id: string;
  name: string;
  plan: string;
  subscriptionStatus: string;
  createdAt?: Date;
  userCount: number;
};

export async function listOrganizationsWithUserCounts(): Promise<AdminOrgRow[]> {
  await connectMongoose();
  const orgs = await OrganizationModel.find().sort({ createdAt: -1 }).lean();
  const db = getMongoDb();
  const out: AdminOrgRow[] = [];
  for (const o of orgs) {
    const oid = String(o._id);
    const userCount = await db.collection(AUTH_USER_COLLECTION).countDocuments({ organizationId: oid });
    out.push({
      _id: oid,
      name: String(o.name ?? ''),
      plan: String(o.plan ?? 'none'),
      subscriptionStatus: String(o.subscriptionStatus ?? 'none'),
      createdAt: o.createdAt,
      userCount,
    });
  }
  return out;
}

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  platformAdmin: boolean;
  createdAt?: Date;
};

export async function listUsersInOrganization(organizationId: string): Promise<AdminUserRow[]> {
  await connectMongoose();
  const db = getMongoDb();
  const rows = await db
    .collection(AUTH_USER_COLLECTION)
    .find({ organizationId })
    .project({ _id: 0, id: 1, email: 1, name: 1, role: 1, platformAdmin: 1, createdAt: 1 })
    .sort({ email: 1 })
    .toArray();

  return rows.map((r) => ({
    id: String((r as { id?: string }).id ?? ''),
    email: String((r as { email?: string }).email ?? ''),
    name: String((r as { name?: string }).name ?? ''),
    role: String((r as { role?: string }).role ?? ''),
    platformAdmin: Boolean((r as { platformAdmin?: boolean }).platformAdmin),
    createdAt: (r as { createdAt?: Date }).createdAt,
  }));
}

export function isValidObjectIdString(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}
