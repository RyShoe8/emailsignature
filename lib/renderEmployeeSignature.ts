import { renderSignature } from 'emailsignature-engine';
import { buildRenderInput, type OrgBrandInput, type EmployeeProfileInput } from '@/lib/email/toRenderInput';
import { engineTemplateFromStoredConfig, type TemplatePresetId } from '@/lib/email/templatePresets';
import type { OrganizationDoc } from '@/models/Organization';
import type { EmployeeDoc } from '@/models/Employee';
import type { SignatureTemplateDoc } from '@/models/SignatureTemplate';
import { getSignatureAssetOrigin } from '@/lib/siteOrigin';

export function orgToBrandInput(org: OrganizationDoc): OrgBrandInput {
  const sl = org.socialLinks as { linkedin?: string; facebook?: string; instagram?: string; reddit?: string } | undefined;
  const loc = org.locations as { dallas?: string; boulder?: string } | undefined;
  return {
    companyName: (org.companyName || org.name || '').trim(),
    website: (org.website || '').trim(),
    logoUrl: (org.logoUrl || '').trim(),
    logoLink: (org.logoLink || '').trim(),
    primaryColor: org.primaryColor || '#0a0a0a',
    fontFamily: org.fontFamily || 'Arial',
    socialLinks: {
      linkedin: sl?.linkedin,
      facebook: sl?.facebook,
      instagram: sl?.instagram,
      reddit: sl?.reddit,
    },
    locations: { dallas: loc?.dallas, boulder: loc?.boulder },
    warehouseAddress: org.warehouseAddress ?? undefined,
    animation: org.animation as OrgBrandInput['animation'],
  };
}

export function employeeToProfile(emp: EmployeeDoc): EmployeeProfileInput {
  return {
    firstName: emp.firstName,
    lastName: emp.lastName,
    title: emp.title || '',
    email: emp.email,
    officePhone: emp.phone?.trim() || undefined,
  };
}

/** Employee LinkedIn overrides org default when set (dashboard + server renders stay aligned). */
export function mergeEmployeeSocialIntoOrgBrand(
  org: OrganizationDoc,
  employee: Pick<EmployeeDoc, 'linkedin'>
): OrgBrandInput {
  const base = orgToBrandInput(org);
  const li = employee.linkedin?.trim();
  return {
    ...base,
    socialLinks: {
      ...base.socialLinks,
      linkedin: li || base.socialLinks.linkedin?.trim() || undefined,
    },
  };
}

export function renderSignatureForEmployee(
  org: OrganizationDoc,
  emp: EmployeeDoc,
  tmpl: SignatureTemplateDoc,
  options?: { publicSiteOrigin?: string }
): string {
  const presetId = tmpl.presetId as TemplatePresetId;
  const includeAnimation = org.plan === 'pro' && Boolean(tmpl.includeAnimationSlot);
  const template = engineTemplateFromStoredConfig({
    templateId: tmpl._id.toString(),
    name: tmpl.name,
    presetId,
    includeAnimationSlot: includeAnimation,
  });
  const publicSiteOrigin = options?.publicSiteOrigin?.trim() || getSignatureAssetOrigin();
  return renderSignature(
    buildRenderInput({
      orgBrand: mergeEmployeeSocialIntoOrgBrand(org, emp),
      employee: employeeToProfile(emp),
      template,
      publicSiteOrigin,
    })
  );
}
