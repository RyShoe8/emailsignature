import { NextResponse } from 'next/server';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { isValidObjectIdString } from '@/lib/admin/data';
import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionPlanModel } from '@/models/SubscriptionPlan';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

/** Clone plan: same slug, next version, cleared Stripe ids (re-sync after edit). */
export async function POST(_request: Request, { params }: Params) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectIdString(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  await connectMongoose();
  const src = await SubscriptionPlanModel.findById(id).lean();
  if (!src) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const latest = await SubscriptionPlanModel.findOne({ slug: src.slug }).sort({ version: -1 }).select('version').lean();
  const nextVersion = (latest?.version ?? 0) + 1;
  const plan = await SubscriptionPlanModel.create({
    name: src.name,
    slug: src.slug,
    active: src.active,
    paused: false,
    interval: src.interval,
    basePriceCents: src.basePriceCents,
    additionalUserPriceCents: src.additionalUserPriceCents,
    includedUsers: src.includedUsers,
    description: src.description,
    badge: src.badge ?? '',
    legacyPlanKey: src.legacyPlanKey ?? '',
    version: nextVersion,
    stripeProductId: '',
    stripeBasePriceId: '',
    stripeSeatPriceId: '',
  });
  return NextResponse.json({ plan });
}
