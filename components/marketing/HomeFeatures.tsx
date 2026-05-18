import { BarChart3, LayoutTemplate, Link2, Mail, Megaphone, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: LayoutTemplate,
    title: 'Curated templates',
    description:
      'Minimal, Stacked, Corporate, and Professional layouts — designed for real email clients, not just mockups.',
  },
  {
    icon: Link2,
    title: 'Built-in UTM codes',
    description:
      'Every http link in your signature gets UTM parameters automatically so you can see email-driven traffic in Google Analytics.',
  },
  {
    icon: Mail,
    title: 'Gmail + Outlook ready',
    description: 'Install to Gmail in one click, or copy HTML that holds up in Outlook and other clients.',
  },
  {
    icon: BarChart3,
    title: 'Click analytics',
    description: 'Optional link tracking shows which signature CTAs get clicks — logo, website, promos, and more.',
  },
  {
    icon: Megaphone,
    title: 'Promotional blocks',
    description: 'Highlight offers, blog posts, or book-a-call buttons beside your signature on premium templates.',
  },
  {
    icon: Users,
    title: 'Team-wide control',
    description: 'Set brand colors, logos, and social links once. Every employee signature stays on-brand.',
  },
] as const;

export function HomeFeatures() {
  return (
    <section className="space-y-8">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Everything you need in one platform</h2>
        <p className="mt-2 text-muted-foreground">
          Professional signatures, measurable results, and zero HTML headaches for your team.
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
