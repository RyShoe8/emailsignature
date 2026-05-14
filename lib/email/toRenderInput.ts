import type {
  RenderSignatureInput,
  SignatureBrand,
  SignatureProfile,
  SignatureTemplate,
} from 'emailsignature-engine';

/** App-side org brand fields that map into engine `SignatureBrand`. */
export type OrgBrandInput = {
  companyName: string;
  website: string;
  logoUrl: string;
  logoLink?: string;
  primaryColor?: string;
  fontFamily?: string;
  socialLinks: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  /** Pro-only extras in UI; engine uses dallas/boulder/warehouse strings. */
  locations?: { dallas?: string; boulder?: string };
  warehouseAddress?: string;
  animation?: { enabled: boolean; gifUrl?: string };
};

export type EmployeeProfileInput = {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  officePhone?: string;
  mobilePhone?: string;
};

export function toSignatureBrand(input: OrgBrandInput): SignatureBrand {
  const loc = input.locations ?? {};
  return {
    companyName: input.companyName.trim(),
    website: input.website.trim(),
    logoUrl: input.logoUrl.trim(),
    logoLink: (input.logoLink ?? '').trim(),
    primaryColor: (input.primaryColor ?? '#0a0a0a').trim(),
    fontFamily: (input.fontFamily ?? 'Arial').trim(),
    socialLinks: {
      linkedin: input.socialLinks.linkedin?.trim() || undefined,
      facebook: input.socialLinks.facebook?.trim() || undefined,
      instagram: input.socialLinks.instagram?.trim() || undefined,
    },
    locations: {
      dallas: loc.dallas?.trim() || undefined,
      boulder: loc.boulder?.trim() || undefined,
    },
    warehouseAddress: input.warehouseAddress?.trim() || undefined,
    animation: {
      enabled: Boolean(input.animation?.enabled),
      gifUrl: input.animation?.gifUrl?.trim() || undefined,
    },
  };
}

export function toSignatureProfile(input: EmployeeProfileInput): SignatureProfile {
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    title: input.title,
    email: input.email,
    officePhone: input.officePhone?.trim() || undefined,
    mobilePhone: input.mobilePhone?.trim() || undefined,
  };
}

export function buildRenderInput(args: {
  orgBrand: OrgBrandInput;
  employee: EmployeeProfileInput;
  template: SignatureTemplate;
  /** Passed to signature engine for absolute /images/... URLs in email HTML */
  publicSiteOrigin?: string;
}): RenderSignatureInput {
  const origin = args.publicSiteOrigin?.trim();
  return {
    profile: toSignatureProfile(args.employee),
    brand: toSignatureBrand(args.orgBrand),
    template: args.template,
    ...(origin ? { publicSiteOrigin: origin } : {}),
  };
}
