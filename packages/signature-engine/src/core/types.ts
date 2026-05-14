export type SignatureProfile = {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  officePhone?: string;
  mobilePhone?: string;
};

export type SignatureBrand = {
  companyName: string;
  website: string;
  logoUrl: string;
  /** Display height in px at fixed 110px width (Outlook); omit for default aspect. */
  logoHeightPx?: number;
  logoLink: string;
  primaryColor: string;
  fontFamily: string;
  socialLinks: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  locations: {
    dallas?: string;
    boulder?: string;
  };
  warehouseAddress?: string;
  animation?: {
    enabled: boolean;
    gifUrl?: string;
  };
};

export type SignatureElement =
  | { type: 'logo' }
  | { type: 'name' }
  | { type: 'title' }
  | { type: 'contact' }
  | { type: 'social' }
  | { type: 'locations' }
  | { type: 'warehouse' }
  | { type: 'divider' }
  | { type: 'animation' };

export type SignatureTemplate = {
  id: string;
  name: string;
  layout: 'standard' | 'stacked';
  elements: SignatureElement[];
};

export type RenderSignatureInput = {
  profile: SignatureProfile;
  brand: SignatureBrand;
  template: SignatureTemplate;
  /** Origin for resolving relative /images/... URLs (e.g. process.env.NEXT_PUBLIC_SITE_URL). */
  publicSiteOrigin?: string;
};
