import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getPublicPricingPlans, type PublicPricingPlan } from '@/lib/billing/getPublicPricingPlans';
import { getBillingEntitlements } from '@/lib/billing/entitlements';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pricing — Tailnote',
};

function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function intervalSuffix(interval: PublicPricingPlan['interval']): string {
  switch (interval) {
    case 'month':
      return '/mo';
    case 'year':
      return '/yr';
    case 'lifetime':
      return '';
    default:
      return '';
  }
}

function primaryPriceLine(plan: PublicPricingPlan): string {
  if (plan.interval === 'lifetime') {
    return `${formatUsd(plan.basePriceCents)} one-time`;
  }
  return `${formatUsd(plan.basePriceCents)}${intervalSuffix(plan.interval)}`;
}

function seatLine(plan: PublicPricingPlan): string | null {
  if (plan.interval === 'lifetime') return null;
  if (plan.additionalUserPriceCents > 0) {
    return `+ ${formatUsd(plan.additionalUserPriceCents)} per additional user${intervalSuffix(plan.interval)} (beyond ${plan.includedUsers} included)`;
  }
  if (plan.includedUsers > 1) {
    return `Includes ${plan.includedUsers} users`;
  }
  return null;
}

function featureSummary(plan: PublicPricingPlan): string | null {
  if (plan.legacyPlanKey !== 'basic' && plan.legacyPlanKey !== 'pro') return null;
  const e = getBillingEntitlements({ plan: plan.legacyPlanKey, subscriptionStatus: 'none' });
  const parts = [`Up to ${e.maxTemplates} signature templates`];
  if (e.canUseTemplateAnimationSlot) {
    parts.push('optional animation slot on templates');
  }
  return parts.join(' · ');
}

export default async function PricingPage() {
  const plans = await getPublicPricingPlans();

  return (
    <div className="mx-auto min-w-0 max-w-5xl px-4 py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">Pricing</h1>
      <p className="text-muted-foreground mb-10 max-w-xl">
        Plans are billed per organization. Amounts and intervals reflect what we offer today; subscribe from the
        dashboard after you sign up.
      </p>
      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No public plans are available right now. Please check back later or contact support.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
          {plans.map((plan) => {
            const summary = featureSummary(plan);
            const seats = seatLine(plan);
            const description =
              plan.description.trim() ||
              (plan.legacyPlanKey === 'pro'
                ? 'Advanced layouts and promotional blocks'
                : plan.legacyPlanKey === 'basic'
                  ? 'Core email signature features'
                  : '');

            return (
              <Card key={plan.slug} className="flex flex-col">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.badge.trim() ? (
                      <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {plan.badge.trim()}
                      </span>
                    ) : null}
                  </div>
                  {description ? <CardDescription>{description}</CardDescription> : null}
                  {summary ? <p className="text-muted-foreground mt-2 text-sm">{summary}</p> : null}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2">
                  <p className="text-3xl font-semibold">{primaryPriceLine(plan)}</p>
                  {seats ? <p className="text-sm text-muted-foreground">{seats}</p> : null}
                  <p className="text-sm text-muted-foreground mt-auto pt-2">Per organization</p>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    className="w-full"
                    variant={plan.legacyPlanKey === 'pro' ? 'accent' : 'default'}
                  >
                    <Link href="/signup">Get started — {plan.name}</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
