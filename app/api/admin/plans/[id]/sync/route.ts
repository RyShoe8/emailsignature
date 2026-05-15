import { NextResponse } from 'next/server';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { isValidObjectIdString } from '@/lib/admin/data';
import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionPlanModel } from '@/models/SubscriptionPlan';
import { syncPlanToStripe, type PlanForSync } from '@/lib/stripe/syncPlanToStripe';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectIdString(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }
  await connectMongoose();
  const plan = await SubscriptionPlanModel.findById(id);
  if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const ids = await syncPlanToStripe(plan as PlanForSync);
    plan.set(ids);
    await plan.save();
    return NextResponse.json({ plan: plan.toJSON() });
  } catch (e) {
    console.error('[syncPlanToStripe]', e);
    const msg = e instanceof Error ? e.message : 'Stripe sync failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
