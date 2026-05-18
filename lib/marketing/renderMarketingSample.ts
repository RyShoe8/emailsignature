import {
  renderSignature,
  type ContentBlockData,
  type SignatureBrand,
  type SignatureProfile,
} from 'emailsignature-engine';
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

function promoImageUrl(origin: string): string {
  return `${origin.replace(/\/+$/, '')}/images/tailnote-logo.png`;
}

/** Diversified promotional blocks per template so marketing previews showcase the product. */
function marketingContentBlocks(
  presetId: TemplatePresetId,
  origin: string
): ContentBlockData[] {
  const img = promoImageUrl(origin);

  switch (presetId) {
    case 'minimal':
      return [
        {
          type: 'book_a_call',
          enabled: true,
          callTitle: 'See a demo',
          callUrl: 'https://www.acmecorp.com/demo',
          callButtonText: 'Book a call',
        },
        {
          type: 'list',
          enabled: true,
          listTitle: 'This week',
          listItems: [
            {
              title: 'Spring sale — 20% off',
              description: 'Ends Friday',
              url: 'https://www.acmecorp.com/sale',
            },
            {
              title: 'Case study: Northwind',
              url: 'https://www.acmecorp.com/customers',
            },
          ],
        },
      ];
    case 'modern':
      return [
        {
          type: 'latest_blogs',
          enabled: true,
          rssItems: [
            {
              title: 'Turn every email into a marketing touchpoint',
              url: 'https://www.acmecorp.com/blog/marketing',
            },
            {
              title: 'Promo blocks that actually get clicks',
              url: 'https://www.acmecorp.com/blog/promos',
            },
            {
              title: 'Track signature traffic with built-in UTMs',
              url: 'https://www.acmecorp.com/blog/utm',
            },
          ],
        },
        {
          type: 'image',
          enabled: true,
          imageUrl: img,
          imageLinkUrl: 'https://www.acmecorp.com/webinar',
        },
      ];
    case 'corporate':
      return [
        {
          type: 'list',
          enabled: true,
          listTitle: 'Featured offers',
          listItems: [
            {
              title: 'Free strategy session',
              description: 'Limited slots',
              url: 'https://www.acmecorp.com/strategy',
            },
            {
              title: 'Product tour',
              url: 'https://www.acmecorp.com/tour',
            },
          ],
        },
        {
          type: 'image',
          enabled: true,
          imageUrl: img,
          imageLinkUrl: 'https://www.acmecorp.com/promo',
        },
      ];
    case 'professional':
      return [
        {
          type: 'book_a_call',
          enabled: true,
          callTitle: 'Talk to sales',
          callUrl: 'https://www.acmecorp.com/contact',
          callButtonText: 'Get pricing',
        },
        {
          type: 'list',
          enabled: true,
          listTitle: 'Resources',
          listItems: [
            {
              title: 'ROI calculator',
              url: 'https://www.acmecorp.com/roi',
            },
            {
              title: 'Customer stories',
              description: '12 industries',
              url: 'https://www.acmecorp.com/stories',
            },
          ],
        },
      ];
    default:
      return [
        {
          type: 'list',
          enabled: true,
          listTitle: 'Promotions',
          listItems: [{ title: 'See what’s new', url: 'https://www.acmecorp.com' }],
        },
      ];
  }
}

function demoBrand(origin: string, presetId: TemplatePresetId): SignatureBrand {
  const logoUrl = promoImageUrl(origin);
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
    contentBlocks: marketingContentBlocks(presetId, origin),
  };
}

/** Renders a live signature HTML sample for marketing pages (server-only). */
export function renderMarketingSample(presetId: TemplatePresetId): string {
  const origin = getSignatureAssetOrigin();
  return renderSignature({
    profile: DEMO_PROFILE,
    brand: demoBrand(origin, presetId),
    template: presetToEngineTemplate(presetId, `marketing-${presetId}`),
    publicSiteOrigin: origin,
    utm: MARKETING_UTM,
  });
}
