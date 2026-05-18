import type { ReactNode } from 'react';
import type { LegalSection } from '@/lib/marketing/legalContent';

type MarketingDocPageProps = {
  title: string;
  lastUpdated?: string;
  intro?: string;
  sections?: LegalSection[];
  children?: ReactNode;
};

function LegalSectionBlock({ section }: { section: LegalSection }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{section.title}</h2>
      {section.paragraphs?.map((paragraph, index) => (
        <p key={index} className="text-muted-foreground leading-relaxed">
          {paragraph}
        </p>
      ))}
      {section.listItems && section.listItems.length > 0 && (
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground leading-relaxed">
          {section.listItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function MarketingDocPage({
  title,
  lastUpdated,
  intro,
  sections,
  children,
}: MarketingDocPageProps) {
  return (
    <article className="mx-auto min-w-0 max-w-3xl px-4 py-12 sm:py-16">
      <header className="mb-10 space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {lastUpdated && <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>}
        {intro && <p className="text-muted-foreground leading-relaxed">{intro}</p>}
      </header>
      <div className="space-y-8">
        {sections?.map((section) => (
          <LegalSectionBlock key={section.title} section={section} />
        ))}
        {children}
      </div>
    </article>
  );
}
