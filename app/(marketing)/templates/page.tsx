import { TEMPLATE_PRESET_META } from '@/lib/email/templatePresets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Templates — Tailnote',
};

export default function TemplatesMarketingPage() {
  return (
    <div className="mx-auto min-w-0 max-w-5xl px-4 py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">Signature templates</h1>
      <p className="text-muted-foreground mb-10 max-w-2xl">
        Three curated layouts — no drag-and-drop chaos. You control brand colors, logo, and contact fields; we keep
        the HTML reliable in real inboxes.
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        {TEMPLATE_PRESET_META.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle>{t.name}</CardTitle>
              <CardDescription>{t.description}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </div>
  );
}
