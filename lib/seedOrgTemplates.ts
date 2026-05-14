import type { Types } from 'mongoose';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';

const PRESETS = ['minimal', 'modern', 'corporate'] as const;

export async function seedDefaultTemplates(organizationId: Types.ObjectId) {
  for (const presetId of PRESETS) {
    const name = presetId[0].toUpperCase() + presetId.slice(1);
    await SignatureTemplateModel.create({
      organizationId,
      name,
      presetId,
      includeAnimationSlot: false,
      config: {},
    });
  }
}

export async function getDefaultTemplateForOrg(organizationId: Types.ObjectId) {
  return SignatureTemplateModel.findOne({ organizationId, presetId: 'minimal' }).sort({ createdAt: 1 });
}
