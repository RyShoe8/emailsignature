import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { EmployeeModel } from '@/models/Employee';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { canUsePaidFeatures } from '@/lib/orgAccess';
import { syncStripeSubscriptionSeatsForOrganization } from '@/lib/stripe/syncSubscriptionSeats';

type SessionUser = { organizationId?: string };

async function requireOrg() {
  const session = await getServerSession();
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return { error: NextResponse.json({ error: 'No organization' }, { status: 400 }) };
  }
  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) return { error: NextResponse.json({ error: 'Organization not found' }, { status: 404 }) };
  if (!canUsePaidFeatures(org)) {
    return { error: NextResponse.json({ error: 'Subscription required' }, { status: 402 }) };
  }
  return { org, user };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }
  await connectMongoose();
  const employee = await EmployeeModel.findOne({
    _id: id,
    organizationId: user.organizationId,
  }).lean();
  if (!employee) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ employee });
}

const PatchSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  title: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  avatarUrl: z.string().optional(),
  templateId: z.string().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = await requireOrg();
  if ('error' in ctx) return ctx.error;
  const { org } = ctx;
  const { id } = await context.params;

  const employee = await EmployeeModel.findOne({ _id: id, organizationId: org._id });
  if (!employee) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.templateId) {
    const t = await SignatureTemplateModel.findOne({
      _id: parsed.data.templateId,
      organizationId: org._id,
    });
    if (!t) {
      return NextResponse.json({ error: 'Invalid template' }, { status: 400 });
    }
    employee.templateId = t._id;
  }

  const data = parsed.data;
  if (data.firstName !== undefined) employee.firstName = data.firstName.trim();
  if (data.lastName !== undefined) employee.lastName = data.lastName.trim();
  if (data.title !== undefined) employee.title = data.title.trim();
  if (data.email !== undefined) employee.email = data.email.trim().toLowerCase();
  if (data.phone !== undefined) employee.phone = data.phone.trim();
  if (data.website !== undefined) employee.website = data.website.trim();
  if (data.linkedin !== undefined) employee.linkedin = data.linkedin.trim();
  if (data.twitter !== undefined) employee.twitter = data.twitter.trim();
  if (data.avatarUrl !== undefined) employee.avatarUrl = data.avatarUrl.trim();

  await employee.save();
  return NextResponse.json({ employee: employee.toObject() });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const ctx = await requireOrg();
  if ('error' in ctx) return ctx.error;
  const { org } = ctx;
  const { id } = await context.params;

  const res = await EmployeeModel.deleteOne({ _id: id, organizationId: org._id });
  if (res.deletedCount === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  void syncStripeSubscriptionSeatsForOrganization(org._id.toString()).catch(() => {});
  return NextResponse.json({ ok: true });
}
