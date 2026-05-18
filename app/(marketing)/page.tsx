import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HomeFeatures } from '@/components/marketing/HomeFeatures';
import { HomePricingTeaser } from '@/components/marketing/HomePricingTeaser';
import { HomeTemplateShowcase } from '@/components/marketing/HomeTemplateShowcase';
import { getPublicPricingPlans } from '@/lib/billing/getPublicPricingPlans';
import { getActiveCatalogPresets } from '@/lib/templates/getEnabledPresets';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tailnote — Email signatures that market your business',
  description:
    'Turn every employee email into a marketing touchpoint with promotional content blocks, built-in UTM tracking, and polished signature templates.',
};

export default async function HomePage() {
  const [plans, presets] = await Promise.all([getPublicPricingPlans(), getActiveCatalogPresets()]);

  return (
    <div className="mx-auto min-w-0 max-w-6xl space-y-20 px-4 py-12 sm:py-16 lg:space-y-24 lg:py-20">
      <section className="mx-auto max-w-3xl text-center">
        <p className="mb-4 text-sm font-medium text-muted-foreground">Tailnote</p>
        <h1 className="mb-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Turn every email into a mini marketing campaign
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Tailnote is more than a signature tool — pair your brand with promotional content blocks, built-in
          UTM tracking, and layouts that look great in Gmail and Outlook.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/signup">Get started free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/pricing">View pricing</Link>
          </Button>
        </div>
      </section>

      <HomeFeatures />

      <HomePricingTeaser plans={plans} />

      <HomeTemplateShowcase presets={presets} />

      <section className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-12 text-center sm:px-10">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ready to market in every email your team sends?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Join teams using Tailnote to promote offers, track clicks, and keep every outbound message on-brand.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/signup">Create your account</Link>
        </Button>
      </section>
    </div>
  );
}
