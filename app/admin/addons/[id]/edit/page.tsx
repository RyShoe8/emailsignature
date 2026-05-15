import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionAddonModel, type SubscriptionAddonDoc } from '@/models/SubscriptionAddon';
import { isValidObjectIdString } from '@/lib/admin/data';
import { AdminAddonForm } from '@/components/admin/AdminAddonForm';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function EditAdminAddonPage({ params }: Props) {
  const { id } = await params;
  if (!isValidObjectIdString(id)) notFound();
  await connectMongoose();
  const addon = await SubscriptionAddonModel.findById(id).lean<SubscriptionAddonDoc>();
  if (!addon) notFound();

  const initial = {
    name: String(addon.name ?? ''),
    slug: String(addon.slug ?? ''),
    interval: (addon.interval as 'month' | 'year' | 'one_time') ?? 'month',
    priceCents: Number(addon.priceCents ?? 0),
    description: String(addon.description ?? ''),
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/addons"
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        ← Add-ons
      </Link>
      <AdminAddonForm mode="edit" addonId={id} initial={initial} />
    </div>
  );
}
