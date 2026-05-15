import Link from 'next/link';
import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionAddonModel } from '@/models/SubscriptionAddon';
import { AdminAddonsTable, type AddonRow } from '@/components/admin/AdminAddonsTable';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function AdminAddonsPage() {
  await connectMongoose();
  const raw = await SubscriptionAddonModel.find().sort({ slug: 1 }).lean();
  const initialAddons: AddonRow[] = raw.map((a) => ({
    _id: String(a._id),
    name: String(a.name ?? ''),
    slug: String(a.slug ?? ''),
    interval: String(a.interval ?? 'month'),
    priceCents: Number(a.priceCents ?? 0),
    active: Boolean(a.active),
    stripePriceId: a.stripePriceId ? String(a.stripePriceId) : '',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Subscription add-ons</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional products; sync creates Stripe product and a new price row.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/addons/new">Create add-on</Link>
        </Button>
      </div>
      <AdminAddonsTable initialAddons={initialAddons} />
    </div>
  );
}
