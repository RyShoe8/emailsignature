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
};
