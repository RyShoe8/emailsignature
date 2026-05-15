import { NextResponse } from 'next/server';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { isValidObjectIdString } from '@/lib/admin/data';
import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionAddonModel } from '@/models/SubscriptionAddon';
import { syncAddonToStripe, type AddonForSync } from '@/lib/stripe/syncAddonToStripe';

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
  const addon = await SubscriptionAddonModel.findById(id);
  if (!addon) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try {
    const ids = await syncAddonToStripe(addon as AddonForSync);
    addon.set(ids);
    await addon.save();
    return NextResponse.json({ addon: addon.toJSON() });
  } catch (e) {
    console.error('[syncAddonToStripe]', e);
    const msg = e instanceof Error ? e.message : 'Stripe sync failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
