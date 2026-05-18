import type { Types } from 'mongoose';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';

const PRESETS = ['minimal', 'modern', 'corporate', 'professional'] as const;

const PRESET_DISPLAY_NAMES: Record<(typeof PRESETS)[number], string> = {
  minimal: 'Minimal',
  modern: 'Stacked',
  corporate: 'Corporate',
  professional: 'Professional',
};

export async function seedDefaultTemplates(organizationId: Types.ObjectId) {
  for (const presetId of PRESETS) {
    const name = PRESET_DISPLAY_NAMES[presetId];
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
