import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { isValidObjectIdString } from '@/lib/admin/data';
import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionPlanModel } from '@/models/SubscriptionPlan';
import { syncPlanToStripe } from '@/lib/stripe/syncPlanToStripe';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  interval: z.enum(['month', 'year', 'lifetime']).optional(),
  basePriceCents: z.number().int().nonnegative().optional(),
  additionalUserPriceCents: z.number().int().nonnegative().optional(),
  includedUsers: z.number().int().min(1).optional(),
  description: z.string().optional(),
  badge: z.string().optional(),
  active: z.boolean().optional(),
  paused: z.boolean().optional(),
  maxSubscriptionSlots: z.number().int().nonnegative().optional(),
  archived: z.boolean().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectIdString(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  await connectMongoose();
  const plan = await SubscriptionPlanModel.findById(id).lean();
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ plan });
}

export async function PATCH(request: Request, { params }: Params) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectIdString(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
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
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No fields' }, { status: 400 });
  }
  await connectMongoose();
  const $set = { ...parsed.data } as Record<string, unknown>;
  if ($set.archived === true) {
    $set.paused = true;
  }
  const plan = await SubscriptionPlanModel.findByIdAndUpdate(id, { $set }, { new: true });
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ plan });
}

export async function DELETE(_request: Request, { params }: Params) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectIdString(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  await connectMongoose();
  const plan = await SubscriptionPlanModel.findByIdAndUpdate(id, { $set: { active: false, paused: true } }, { new: true });
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ plan, deactivated: true });
}
