import { randomBytes } from 'crypto';
import type { Types } from 'mongoose';
import mongoose from 'mongoose';
import { connectMongoose, getMongoDb } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { getDefaultTemplateForOrg } from '@/lib/seedOrgTemplates';
import { nameFromEmail } from '@/lib/employees/nameFromEmail';

export type OwnerUserRef = {
  id: string;
  email: string;
  name?: string | null;
};

function namesFromOwner(owner: OwnerUserRef): { firstName: string; lastName: string } {
  const trimmed = (owner.name || '').trim();
  if (trimmed) {
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
    }
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }
  }
  return nameFromEmail(owner.email);
}

/** Idempotent: ensure the org owner has an Employee row for seat billing and analytics. */
export async function ensureOwnerEmployee(
  organizationId: Types.ObjectId | string,
  owner: OwnerUserRef
): Promise<void> {
  await connectMongoose();
  const orgId =
    typeof organizationId === 'string'
      ? new mongoose.Types.ObjectId(organizationId)
      : organizationId;

  const email = owner.email.trim().toLowerCase();
  if (!email || !owner.id) return;

  const linked = await EmployeeModel.findOne({ organizationId: orgId, userId: owner.id })
    .select('_id')
    .lean<{ _id: mongoose.Types.ObjectId }>();
  if (linked) return;

  const byEmail = await EmployeeModel.findOne({ organizationId: orgId, email })
    .select('_id userId')
    .lean<{ _id: mongoose.Types.ObjectId; userId?: string }>();
  if (byEmail) {
    if (!byEmail.userId) {
      await EmployeeModel.updateOne({ _id: byEmail._id }, { $set: { userId: owner.id } });
    }
    return;
  }

  const def = await getDefaultTemplateForOrg(orgId);
  if (!def) return;

  const { firstName, lastName } = namesFromOwner(owner);
  const previewToken = randomBytes(24).toString('hex');

  await EmployeeModel.create({
    organizationId: orgId,
    firstName,
    lastName,
    title: '',
    email,
    templateId: def._id,
    previewToken,
    userId: owner.id,
  });
}

/** Backfill owner employee when only organizationId is known (e.g. seat limits). */
export async function ensureOwnerEmployeeForOrganization(
  organizationId: Types.ObjectId | string
): Promise<void> {
  await connectMongoose();
  const orgIdStr =
    typeof organizationId === 'string' ? organizationId : organizationId.toString();

  const owner = await getMongoDb().collection('user').findOne<{
    id?: string;
    _id?: { toString(): string };
    email?: string;
    name?: string | null;
  }>({
    organizationId: orgIdStr,
    role: 'owner',
  });

  if (!owner?.email) return;

  const id =
    typeof owner.id === 'string'
      ? owner.id
      : owner._id
        ? owner._id.toString()
        : '';
  if (!id) return;

  await ensureOwnerEmployee(organizationId, {
    id,
    email: owner.email,
    name: owner.name,
  });
}
