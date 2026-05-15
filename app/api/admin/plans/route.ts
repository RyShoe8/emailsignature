import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { ensureDefaultSubscriptionPlans } from '@/lib/billing/ensureDefaultPlans';
import { getPlanSubscriptionCapUsage } from '@/lib/billing/planSubscriptionCap';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  interval: z.enum(['month', 'year', 'lifetime']),
  basePriceCents: z.number().int().nonnegative(),
  additionalUserPriceCents: z.number().int().nonnegative().optional(),
  includedUsers: z.number().int().min(1).optional(),
  description: z.string().optional(),
  badge: z.string().optional(),
  active: z.boolean().optional(),
  paused: z.boolean().optional(),
  maxSubscriptionSlots: z.number().int().nonnegative().optional(),
  archived: z.boolean().optional(),
});

async function enrichPlans(plans: SubscriptionPlanDoc[]) {
  return Promise.all(
    plans.map(async (p) => {
      const usage = await getPlanSubscriptionCapUsage(p);
      return {
        ...p,
        subscriptionCount: usage.used,
        slotsRemaining: usage.remaining,
        soldOut: usage.soldOut,
      };
    })
  );
}

export async function GET(request: Request) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  await connectMongoose();
  await ensureDefaultSubscriptionPlans();

  const url = new URL(request.url);
  const archivedParam = url.searchParams.get('archived');
  const archived = archivedParam === 'true';

  const plans = await SubscriptionPlanModel.find({ archived })
    .sort({ slug: 1, version: -1 })
    .lean<SubscriptionPlanDoc[]>();

  const enriched = await enrichPlans(plans);
  return NextResponse.json({ plans: enriched });
}

export async function POST(request: Request) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
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
  await connectMongoose();
  const maxV = await SubscriptionPlanModel.findOne({ slug: parsed.data.slug })
    .sort({ version: -1 })
    .select('version')
    .lean();
  const version = (maxV?.version ?? 0) + 1;
  try {
    const plan = await SubscriptionPlanModel.create({
      ...parsed.data,
      additionalUserPriceCents: parsed.data.additionalUserPriceCents ?? 0,
      includedUsers: parsed.data.includedUsers ?? 1,
      description: parsed.data.description ?? '',
      badge: parsed.data.badge ?? '',
      active: parsed.data.active ?? true,
      paused: parsed.data.paused ?? false,
      maxSubscriptionSlots: parsed.data.maxSubscriptionSlots ?? 0,
      archived: parsed.data.archived ?? false,
      version,
    });
    return NextResponse.json({ plan });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Create failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
