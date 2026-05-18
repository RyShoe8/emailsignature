import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { EmployeeModel } from '@/models/Employee';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { canUsePaidFeatures } from '@/lib/orgAccess';
import { getDefaultTemplateForOrg } from '@/lib/seedOrgTemplates';
import { findOrgTemplateWithAvailablePreset } from '@/lib/templates/validateOrgTemplate';
import { syncStripeSubscriptionSeatsForOrganization } from '@/lib/stripe/syncSubscriptionSeats';
import {
  assertCanAddEmployee,
  EmployeeLimitReachedError,
  getEmployeeLimitsForOrganization,
} from '@/lib/billing/employeeLimits';

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

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ employees: [] });
  }
  await connectMongoose();
  const [employees, limits] = await Promise.all([
    EmployeeModel.find({ organizationId: user.organizationId })
      .sort({ createdAt: -1 })
      .lean(),
    getEmployeeLimitsForOrganization(user.organizationId),
  ]);
  return NextResponse.json({ employees, limits });
}

const CreateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  title: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  avatarUrl: z.string().optional(),
  templateId: z.string().optional(),
});

export async function POST(request: Request) {
  const ctx = await requireOrg();
  if ('error' in ctx) return ctx.error;
  const { org } = ctx;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    await assertCanAddEmployee(org._id);
  } catch (e) {
    if (e instanceof EmployeeLimitReachedError) {
      return NextResponse.json(
        {
          error: e.message,
          code: e.code,
          maxEmployees: e.maxEmployees,
          currentCount: e.currentCount,
        },
        { status: 403 }
      );
    }
    throw e;
  }

  let templateId = parsed.data.templateId;
  if (!templateId) {
    const def = await getDefaultTemplateForOrg(org._id);
    if (!def) {
      return NextResponse.json({ error: 'No templates for organization' }, { status: 400 });
    }
    templateId = def._id.toString();
  } else {
    const t = await findOrgTemplateWithAvailablePreset(templateId, org._id);
    if (!t) {
      return NextResponse.json({ error: 'Invalid or unavailable template' }, { status: 400 });
    }
  }

  const previewToken = randomBytes(24).toString('hex');

  const employee = await EmployeeModel.create({
    organizationId: org._id,
    firstName: parsed.data.firstName.trim(),
    lastName: parsed.data.lastName.trim(),
    title: parsed.data.title?.trim() ?? '',
    email: parsed.data.email.trim().toLowerCase(),
    phone: parsed.data.phone?.trim() ?? '',
    website: parsed.data.website?.trim() ?? '',
    linkedin: parsed.data.linkedin?.trim() ?? '',
    twitter: parsed.data.twitter?.trim() ?? '',
    avatarUrl: parsed.data.avatarUrl?.trim() ?? '',
    templateId,
    previewToken,
  });

  void syncStripeSubscriptionSeatsForOrganization(org._id.toString()).catch(() => {});

  return NextResponse.json({ employee: employee.toObject() });
}
