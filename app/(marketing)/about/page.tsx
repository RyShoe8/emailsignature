import { MarketingDocPage } from '@/components/marketing/MarketingDocPage';
import { aboutContent, LEGAL_LAST_UPDATED } from '@/lib/marketing/legalContent';

export const metadata = {
  title: 'About Us — Tailnote',
};

export default function AboutPage() {
  return (
    <MarketingDocPage
      title={aboutContent.title}
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={aboutContent.intro}
      sections={aboutContent.sections}
    />
  );
}
