export type SignatureProfile = {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  officePhone?: string;
  mobilePhone?: string;
};

export type ContentBlockData = {
  type: 'book_a_call' | 'latest_blogs' | 'custom';
  enabled: boolean;
  callTitle?: string;
  callUrl?: string;
  callButtonText?: string;
  rssUrl?: string;
  rssItems?: { title: string; url: string; imageUrl?: string; pubDate?: string }[];
  rssLastFetched?: string;
  rssRefreshInterval?: 'none' | 'daily' | 'weekly';
  customTitle?: string;
  customText?: string;
  customUrl?: string;
  customImageUrl?: string;
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
    reddit?: string;
  };
  address?: string;
  state?: string;
  zip?: string;
  animation?: {
    enabled: boolean;
    gifUrl?: string;
  };
  contentBlocks?: ContentBlockData[];
};

export type SignatureElement =
  | { type: 'logo' }
  | { type: 'name' }
  | { type: 'title' }
  | { type: 'contact' }
  | { type: 'social' }
  | { type: 'address' }
  | { type: 'divider' }
  | { type: 'animation' }
  | { type: 'contentBlocks' };

export type SignatureLayout = 'standard' | 'stacked' | 'corporate';

export type SignatureTemplate = {
  id: string;
  name: string;
  layout: SignatureLayout;
  elements: SignatureElement[];
};

export type RenderSignatureInput = {
  profile: SignatureProfile;
  brand: SignatureBrand;
  template: SignatureTemplate;
  /** Origin for resolving relative /images/... URLs (e.g. process.env.NEXT_PUBLIC_SITE_URL). */
  publicSiteOrigin?: string;
  /** UTM params to append to http/https links. false = disabled. */
  utm?: { source: string; medium: string; campaign: string } | false;
};
