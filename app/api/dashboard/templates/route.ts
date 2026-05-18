import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel, type OrganizationDoc } from '@/models/Organization';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { getBillingEntitlements } from '@/lib/billing/entitlements';
import { renameModernTemplatesToStacked } from '@/lib/email/renameModernTemplates';
import { ensureOrgPresetTemplates } from '@/lib/seedOrgTemplates';

type SessionUser = { organizationId?: string };

function maxTemplates(org: OrganizationDoc) {
  return getBillingEntitlements(org).maxTemplates;
}

async function requireOrgMember() {
  const session = await getServerSession();
  if (!session?.user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return { error: NextResponse.json({ error: 'No organization' }, { status: 400 }) };
  }
  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) return { error: NextResponse.json({ error: 'Organization not found' }, { status: 404 }) };
  return { org, user };
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ templates: [] });
  }
  await connectMongoose();
  await renameModernTemplatesToStacked(user.organizationId);
  await ensureOrgPresetTemplates(user.organizationId);
  const templates = await SignatureTemplateModel.find({ organizationId: user.organizationId })
    .sort({ createdAt: 1 })
    .lean();
  return NextResponse.json({ templates });
}

const PostSchema = z.object({
  name: z.string().min(1).max(80),
  presetId: z.enum(['minimal', 'modern', 'corporate', 'professional']),
  includeAnimationSlot: z.boolean().optional(),
});

export async function POST(request: Request) {
  const ctx = await requireOrgMember();
  if ('error' in ctx) return ctx.error;
  const { org } = ctx;

  const count = await SignatureTemplateModel.countDocuments({ organizationId: org._id });
  if (count >= maxTemplates(org)) {
    return NextResponse.json({ error: 'Template limit reached for your plan' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = PostSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const includeAnimationSlot =
    getBillingEntitlements(org).canUseTemplateAnimationSlot && Boolean(parsed.data.includeAnimationSlot);

  const doc = await SignatureTemplateModel.create({
    organizationId: org._id,
    name: parsed.data.name.trim(),
    presetId: parsed.data.presetId,
    includeAnimationSlot,
    config: {},
  });

  return NextResponse.json({ template: doc.toObject() });
}
