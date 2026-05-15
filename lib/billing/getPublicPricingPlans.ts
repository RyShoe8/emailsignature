import { connectMongoose } from '@/lib/mongoose';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { ensureDefaultSubscriptionPlans } from '@/lib/billing/ensureDefaultPlans';

/** Serializable plan row for marketing / pricing UI (latest version per slug). */
export type PublicPricingPlan = {
  slug: string;
  name: string;
  description: string;
  badge: string;
  interval: SubscriptionPlanDoc['interval'];
  basePriceCents: number;
  additionalUserPriceCents: number;
  includedUsers: number;
  legacyPlanKey: '' | 'basic' | 'pro';
  version: number;
};

/**
 * Active, non-paused plans for public pricing — one card per slug (highest version).
 */
export async function getPublicPricingPlans(): Promise<PublicPricingPlan[]> {
  await connectMongoose();
  await ensureDefaultSubscriptionPlans();

  const rows = await SubscriptionPlanModel.find({ active: true, paused: false })
    .sort({ slug: 1, version: -1 })
    .lean<SubscriptionPlanDoc[]>();

  const seen = new Set<string>();
  const out: PublicPricingPlan[] = [];

  for (const r of rows) {
    const slug = String(r.slug ?? '');
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);

    const legacy = r.legacyPlanKey;
    const legacyPlanKey: '' | 'basic' | 'pro' =
      legacy === 'basic' || legacy === 'pro' ? legacy : '';

    out.push({
      slug,
      name: String(r.name ?? ''),
      description: String(r.description ?? ''),
      badge: String(r.badge ?? ''),
      interval: r.interval,
      basePriceCents: Number(r.basePriceCents ?? 0),
      additionalUserPriceCents: Number(r.additionalUserPriceCents ?? 0),
      includedUsers: Math.max(1, Number(r.includedUsers ?? 1)),
      legacyPlanKey,
      version: Number(r.version ?? 1),
    });
  }

  return out;
}
