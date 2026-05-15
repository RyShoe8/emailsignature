import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { isValidObjectIdString } from '@/lib/admin/data';
import { AdminPlanForm } from '@/components/admin/AdminPlanForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function EditAdminPlanPage({ params }: Props) {
  const { id } = await params;
  if (!isValidObjectIdString(id)) notFound();
  await connectMongoose();
  const p = await SubscriptionPlanModel.findById(id).lean<SubscriptionPlanDoc>();
  if (!p) notFound();

  const legacyPlanKey: '' | 'basic' | 'pro' =
    p.legacyPlanKey === 'basic' || p.legacyPlanKey === 'pro' ? p.legacyPlanKey : '';

  const initial = {
    name: String(p.name ?? ''),
    slug: String(p.slug ?? ''),
    interval: (p.interval as 'month' | 'year' | 'lifetime') ?? 'year',
    basePriceCents: Number(p.basePriceCents ?? 0),
    additionalUserPriceCents: Number(p.additionalUserPriceCents ?? 0),
    includedUsers: Number(p.includedUsers ?? 1),
    description: String(p.description ?? ''),
    badge: String(p.badge ?? ''),
    legacyPlanKey,
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/plans" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
        ← Plans
      </Link>
      <AdminPlanForm mode="edit" planId={id} initial={initial} />
    </div>
  );
}
