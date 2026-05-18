import { renderSignature, type SignatureBrand, type SignatureProfile } from 'emailsignature-engine';
import { presetToEngineTemplate, type TemplatePresetId } from '@/lib/email/templatePresets';
import { getSignatureAssetOrigin } from '@/lib/siteOrigin';

const MARKETING_UTM = { source: 'Tailnote', medium: 'Email', campaign: 'Footer' } as const;

const DEMO_PROFILE: SignatureProfile = {
  firstName: 'Alex',
  lastName: 'Morgan',
  title: 'Account Executive',
  email: 'alex@acmecorp.com',
  officePhone: '(555) 123-4567',
};

function demoBrand(origin: string): SignatureBrand {
  const logoUrl = `${origin.replace(/\/+$/, '')}/images/tailnote-logo.png`;
  return {
    companyName: 'Acme Corp',
    website: 'www.acmecorp.com',
    logoUrl,
    logoLink: 'https://www.acmecorp.com',
    primaryColor: '#2563eb',
    fontFamily: 'Arial',
    socialLinks: {
      linkedin: 'https://www.linkedin.com/company/example',
      facebook: 'https://www.facebook.com/example',
    },
    address: '123 Main St',
    state: 'TX',
    zip: '75201',
    animation: { enabled: false, gifUrl: '' },
  };
}

/** Renders a live signature HTML sample for marketing pages (server-only). */
export function renderMarketingSample(presetId: TemplatePresetId): string {
  const origin = getSignatureAssetOrigin();
  return renderSignature({
    profile: DEMO_PROFILE,
    brand: demoBrand(origin),
    template: presetToEngineTemplate(presetId, `marketing-${presetId}`),
    publicSiteOrigin: origin,
    utm: MARKETING_UTM,
  });
}
