import { MarketingDocPage } from '@/components/marketing/MarketingDocPage';
import { LEGAL_LAST_UPDATED, privacyContent } from '@/lib/marketing/legalContent';

export const metadata = {
  title: 'Privacy Policy — Tailnote',
};

export default function PrivacyPage() {
  return (
    <MarketingDocPage
      title={privacyContent.title}
      lastUpdated={LEGAL_LAST_UPDATED}
      intro={privacyContent.intro}
      sections={privacyContent.sections}
    />
  );
}
