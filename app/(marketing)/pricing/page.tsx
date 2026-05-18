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

function seatLine(plan: PublicPricingPlan): string | null {
  if (plan.interval === 'lifetime') return null;
  if (plan.additionalUserPriceCents > 0) {
    return `+ ${formatUsd(plan.additionalUserPriceCents)} per additional user${intervalSuffix(plan.interval)} (beyond ${plan.includedUsers} included)`;
  }
  const n = Math.max(1, plan.includedUsers);
  return `Includes ${n} user${n === 1 ? '' : 's'} — no additional users`;
}

export default async function PricingPage() {
  const plans = await getPublicPricingPlans();

  return (
    <div className="mx-auto min-w-0 max-w-5xl px-4 py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">Pricing</h1>
      <p className="text-muted-foreground mb-10 max-w-xl">
        Plans are billed per organization. Every plan includes all Tailnote signature features. Subscribe from
        the dashboard after you sign up.
      </p>
      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No public plans are available right now. Please check back later or contact support.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
          {plans.map((plan) => {
            const seats = seatLine(plan);
            const description = plan.description.trim();

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
                    {plan.soldOut ? (
                      <span className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                        Sold out
                      </span>
                    ) : null}
                  </div>
                  {description ? <CardDescription>{description}</CardDescription> : null}
                  <p className="text-muted-foreground mt-2 text-sm">
                    All signature templates, animation slots, and team features included.
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-2">
                  <p className="text-3xl font-semibold">{primaryPriceLine(plan)}</p>
                  {seats ? <p className="text-sm text-muted-foreground">{seats}</p> : null}
                  <p className="text-sm text-muted-foreground mt-auto pt-2">Per organization</p>
                </CardContent>
                <CardFooter>
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
