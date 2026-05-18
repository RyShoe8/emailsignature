import type { Types } from 'mongoose';
import { SignatureTemplateModel, type SignatureTemplateDoc } from '@/models/SignatureTemplate';
import { isPresetAvailable } from '@/lib/templates/getEnabledPresets';

/** Returns null if template belongs to org and its preset is globally available. */
export async function findOrgTemplateWithAvailablePreset(
  templateId: string,
  organizationId: Types.ObjectId | string
): Promise<SignatureTemplateDoc | null> {
  const tmpl = await SignatureTemplateModel.findOne({
    _id: templateId,
    organizationId,
  });
  if (!tmpl) return null;
  if (!(await isPresetAvailable(String(tmpl.presetId)))) return null;
  return tmpl;
}
