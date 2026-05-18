import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { PublicPricingPlan } from '@/lib/billing/getPublicPricingPlans';

function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function intervalLabel(interval: PublicPricingPlan['interval']): string {
  switch (interval) {
    case 'month':
      return 'month';
    case 'year':
      return 'year';
    case 'lifetime':
      return 'one-time';
    default:
      return interval;
  }
}

function lowestPricedPlan(plans: PublicPricingPlan[]): PublicPricingPlan | null {
  if (plans.length === 0) return null;
  return [...plans].sort((a, b) => a.basePriceCents - b.basePriceCents)[0] ?? null;
}

type Props = {
  plans: PublicPricingPlan[];
};

export function HomePricingTeaser({ plans }: Props) {
  const lowest = lowestPricedPlan(plans.filter((p) => !p.soldOut));
  const fallback = lowest ?? lowestPricedPlan(plans);

  return (
    <section className="rounded-2xl border bg-muted/30 px-6 py-10 sm:px-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Enterprise marketing in every inbox — without enterprise pricing
          </h2>
          <p className="max-w-2xl text-muted-foreground">
            Skip expensive agency rebuilds. Tailnote gives your whole team on-brand signatures, promotional
            content blocks, built-in UTM tracking, and Gmail-ready installs — for a fraction of what
            you&apos;d pay elsewhere.
          </p>
          {fallback ? (
            <p className="text-lg font-medium text-foreground">
              Plans from{' '}
              <span className="text-primary">
                {formatUsd(fallback.basePriceCents)}
                {fallback.interval === 'lifetime' ? '' : ` / ${intervalLabel(fallback.interval)}`}
              </span>{' '}
              per subscription
            </p>
          ) : null}
          {plans.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {plans.map((p) => (
                <span
                  key={p.slug}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {p.name}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <Button asChild size="lg" className="shrink-0 self-start lg:self-center">
          <Link href="/pricing">See pricing</Link>
        </Button>
      </div>
    </section>
  );
}
