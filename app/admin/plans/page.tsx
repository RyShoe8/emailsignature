import Link from 'next/link';
import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionPlanModel } from '@/models/SubscriptionPlan';
import { ensureDefaultSubscriptionPlans } from '@/lib/billing/ensureDefaultPlans';
import { AdminPlansTable, type PlanRow } from '@/components/admin/AdminPlansTable';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function AdminPlansPage() {
  await connectMongoose();
  await ensureDefaultSubscriptionPlans();
  const raw = await SubscriptionPlanModel.find().sort({ slug: 1, version: -1 }).lean();
  const initialPlans: PlanRow[] = raw.map((p) => ({
    _id: String(p._id),
    name: String(p.name ?? ''),
    slug: String(p.slug ?? ''),
    interval: String(p.interval ?? 'year'),
    basePriceCents: Number(p.basePriceCents ?? 0),
    additionalUserPriceCents: Number(p.additionalUserPriceCents ?? 0),
    includedUsers: Number(p.includedUsers ?? 1),
    active: Boolean(p.active),
    paused: Boolean(p.paused),
    version: Number(p.version ?? 1),
    stripeBasePriceId: p.stripeBasePriceId ? String(p.stripeBasePriceId) : '',
    legacyPlanKey: p.legacyPlanKey ? String(p.legacyPlanKey) : '',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Subscription plans</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Source of truth for pricing. Sync creates Stripe products and immutable prices.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/plans/new">Create plan</Link>
        </Button>
      </div>
      <AdminPlansTable initialPlans={initialPlans} />
    </div>
  );
}
