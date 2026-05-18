import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MarketingSignaturePreview } from '@/components/marketing/MarketingSignaturePreview';
import type { TemplatePresetId } from '@/lib/email/templatePresets';
import { marketingTemplateScreenshotPath } from '@/lib/marketing/marketingTemplateScreenshots';
import type { CatalogPresetRow } from '@/lib/templates/getEnabledPresets';

type Props = {
  presets: CatalogPresetRow[];
};

export function HomeTemplateShowcase({ presets }: Props) {
  if (presets.length === 0) return null;

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Templates built for signatures and promotional blocks
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Real customer-style examples with promotional blocks — so you can see how Tailnote turns email
            into a marketing channel.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0 self-start sm:self-auto">
          <Link href="/templates">View all templates</Link>
        </Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {presets.map((preset) => {
          const presetId = preset.presetId as TemplatePresetId;
          return (
            <Card key={preset.presetId} className="min-w-0 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{preset.name}</CardTitle>
                {preset.description ? (
                  <CardDescription>{preset.description}</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="min-w-0 pt-0">
                <MarketingSignaturePreview
                  imageSrc={marketingTemplateScreenshotPath(presetId)}
                  alt={`${preset.name} signature example`}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
