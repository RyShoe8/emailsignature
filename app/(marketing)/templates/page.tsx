import { connectMongoose } from '@/lib/mongoose';
import { getActiveCatalogPresets } from '@/lib/templates/getEnabledPresets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {presets.map((t) => (
            <Card key={t.presetId}>
              <CardHeader>
                <CardTitle>{t.name}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
