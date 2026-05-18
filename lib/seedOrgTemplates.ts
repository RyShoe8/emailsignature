import type { Types } from 'mongoose';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';

export const ORG_TEMPLATE_PRESETS = ['minimal', 'modern', 'corporate', 'professional'] as const;

const PRESETS = ORG_TEMPLATE_PRESETS;

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

/** Idempotent: add any built-in preset rows missing for this org (e.g. Professional on older orgs). */
export async function ensureOrgPresetTemplates(organizationId: Types.ObjectId | string) {
  for (const presetId of PRESETS) {
    const exists = await SignatureTemplateModel.exists({ organizationId, presetId });
    if (exists) continue;
    await SignatureTemplateModel.create({
      organizationId,
      name: PRESET_DISPLAY_NAMES[presetId],
      presetId,
      includeAnimationSlot: false,
      config: {},
    });
  }
}

export async function getDefaultTemplateForOrg(organizationId: Types.ObjectId) {
  return SignatureTemplateModel.findOne({ organizationId, presetId: 'minimal' }).sort({ createdAt: 1 });
}
