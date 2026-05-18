import { connectMongoose } from '@/lib/mongoose';
import { getActiveCatalogPresets } from '@/lib/templates/getEnabledPresets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MarketingSignaturePreview } from '@/components/marketing/MarketingSignaturePreview';
import type { TemplatePresetId } from '@/lib/email/templatePresets';
import { renderMarketingSample } from '@/lib/marketing/renderMarketingSample';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Templates — Tailnote',
};

export default async function TemplatesMarketingPage() {
  await connectMongoose();
  const presets = await getActiveCatalogPresets();

  return (
    <div className="mx-auto min-w-0 max-w-5xl px-4 py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">Signature templates</h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        Curated layouts — no drag-and-drop chaos. You control brand colors, logo, and contact fields; we keep
        the HTML reliable in real inboxes.
      </p>
      {presets.length === 0 ? (
        <p className="text-sm text-muted-foreground">No templates are currently available.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {presets.map((t) => {
            const html = renderMarketingSample(t.presetId as TemplatePresetId);
            return (
              <Card key={t.presetId} className="min-w-0 overflow-hidden">
                <CardHeader>
                  <CardTitle>{t.name}</CardTitle>
                  <CardDescription>{t.description}</CardDescription>
                </CardHeader>
                <CardContent className="min-w-0">
                  <MarketingSignaturePreview html={html} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
