import type { SignatureBrand, SignatureTemplate, SignatureElement } from './core/types';

/** Full default element set for engine tests and previews. */
export const defaultSignatureElements: SignatureElement[] = [
  { type: 'logo' },
  { type: 'name' },
  { type: 'title' },
  { type: 'contact' },
  { type: 'social' },
  { type: 'divider' },
  { type: 'locations' },
  { type: 'warehouse' },
];

export const mockSignatureBrand: SignatureBrand = {
  companyName: 'Acme Corp',
  website: 'www.example.com',
  logoUrl: 'https://example.com/images/logo.png',
  logoLink: 'https://example.com',
  primaryColor: '#2563eb',
  fontFamily: 'Arial',
  socialLinks: {
    linkedin: 'https://www.linkedin.com/company/example',
    facebook: 'https://www.facebook.com/example',
    instagram: 'https://www.instagram.com/example',
    reddit: 'https://www.reddit.com/user/example',
  },
  locations: {
    dallas: '123 Design Way, Dallas, TX',
    boulder: '456 Mountain Rd, Boulder, CO',
  },
  warehouseAddress: '789 Logistics Blvd, Dallas, TX 75201',
  animation: {
    enabled: false,
    gifUrl: '',
  },
};

export function mockSignatureTemplate(
  layout: SignatureTemplate['layout'] = 'standard'
): SignatureTemplate {
  return {
    id: 'default',
    name: 'Organization default',
    layout,
    elements: [...defaultSignatureElements],
  };
}
