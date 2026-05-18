import { BarChart3, LayoutTemplate, Link2, Mail, Megaphone, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: Megaphone,
    title: 'Promotional content blocks',
    description:
      'Book-a-call buttons, offer lists, blog feeds, and image banners live next to every signature — turning routine emails into mini campaigns.',
  },
  {
    icon: Link2,
    title: 'Built-in UTM tracking',
    description:
      'Every link gets UTM parameters automatically so you can attribute site visits and conversions to email in Google Analytics.',
  },
  {
    icon: LayoutTemplate,
    title: 'Curated templates',
    description:
      'Minimal, Stacked, Corporate, and Professional layouts designed for real inboxes — signature plus promos, no broken HTML.',
  },
  {
    icon: BarChart3,
    title: 'Click analytics',
    description:
      'See which promos, logos, and CTAs get clicks so you can refine what you promote in every outbound email.',
  },
  {
    icon: Mail,
    title: 'Gmail + Outlook ready',
    description: 'Install to Gmail in one click, or copy HTML that holds up in Outlook and other clients.',
  },
  {
    icon: Users,
    title: 'Team-wide control',
    description: 'Set brand, offers, and social links once. Every employee sends the same on-brand marketing footprint.',
  },
] as const;

export function HomeFeatures() {
  return (
    <section className="space-y-8">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          More than a signature — a marketing channel in every send
        </h2>
        <p className="mt-2 text-muted-foreground">
          Tailnote combines on-brand signatures with promotional blocks and measurable links, so every
          employee email promotes your business without extra tools.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
