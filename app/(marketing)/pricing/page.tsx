import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getPublicPricingPlans, type PublicPricingPlan } from '@/lib/billing/getPublicPricingPlans';

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

function seatPolicyLine(plan: PublicPricingPlan): string | null {
  if (plan.interval === 'lifetime') return null;
  const n = Math.max(1, plan.includedUsers);
  if (plan.additionalUserPriceCents > 0) {
    return `Includes ${n} user${n === 1 ? '' : 's'} — add more anytime for ${formatUsd(plan.additionalUserPriceCents)} per user${intervalSuffix(plan.interval)}`;
  }
  return `Includes ${n} user${n === 1 ? '' : 's'} — no additional seats available`;
}

function subscriptionCap(plan: PublicPricingPlan): { max: number; remaining: number } | null {
  const max = plan.maxSubscriptionSlots;
  if (max <= 0) return null;
  return { max, remaining: Math.max(0, max - plan.subscriptionCount) };
}

function planFeatureBullets(plan: PublicPricingPlan): string[] {
  const bullets = [
    'Every professional signature template — Standard, Corporate, Professional, and more',
    'One brand look across your whole team',
    'Install to Gmail in a click, plus copy-ready HTML for Outlook',
    'Promotional content blocks on premium layouts',
    'Optional click analytics on signature links',
  ];

  const seats = seatPolicyLine(plan);
  if (seats) bullets.push(seats);

  return bullets;
}

function SubscriptionAvailabilityCallout({ plan }: { plan: PublicPricingPlan }) {
  const cap = subscriptionCap(plan);
  if (!cap) return null;

  if (plan.soldOut) {
    return (
      <div className="rounded-lg border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Sold out</p>
        <p className="mt-1 text-lg font-semibold text-destructive">All {cap.max} subscriptions claimed</p>
        <p className="text-sm text-muted-foreground">Check back later or choose another plan</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border-2 border-primary/25 bg-primary/5 px-4 py-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Limited availability</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">{cap.remaining}</p>
      <p className="text-sm text-muted-foreground">
        of {cap.max} subscription{cap.max === 1 ? '' : 's'} still available — claim yours before they&apos;re
        gone
      </p>
    </div>
  );
}

export default async function PricingPage() {
  const plans = await getPublicPricingPlans();

  return (
    <div className="mx-auto min-w-0 max-w-5xl px-4 py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">Pricing</h1>
      <p className="text-muted-foreground mb-10 max-w-xl">
        Billed per subscription. Each subscription covers one organization with every Tailnote signature
        feature. Pick a plan, sign up, and subscribe from your dashboard.
      </p>
      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No public plans are available right now. Please check back later or contact support.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
          {plans.map((plan) => {
            const description = plan.description.trim();
            const features = planFeatureBullets(plan);
            const hasCap = subscriptionCap(plan) !== null;

            return (
              <Card key={plan.slug} className="flex flex-col">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.badge.trim() ? (
                      <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {plan.badge.trim()}
                      </span>
                    ) : null}
                    {plan.soldOut ? (
                      <span className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Sold out
                      </span>
                    ) : null}
                  </div>
                  {description ? <CardDescription>{description}</CardDescription> : null}
                  {hasCap ? <SubscriptionAvailabilityCallout plan={plan} /> : null}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div>
                    <p className="text-3xl font-semibold">{primaryPriceLine(plan)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Per subscription</p>
                  </div>
                  <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
                    {features.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="mt-auto">
                  {plan.soldOut ? (
                    <Button className="w-full" disabled>
                      Sold out
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link href="/signup">Get started — {plan.name}</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
