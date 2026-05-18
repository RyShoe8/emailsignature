import { MarketingDocPage } from '@/components/marketing/MarketingDocPage';
import { LEGAL_LAST_UPDATED, termsContent } from '@/lib/marketing/legalContent';

export const metadata = {
  title: 'Terms and Conditions — Tailnote',
};

export default function TermsPage() {
  return (
    <MarketingDocPage
      title={termsContent.title}
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={termsContent.intro}
      sections={termsContent.sections}
    />
  );
}
