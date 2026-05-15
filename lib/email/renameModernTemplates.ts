import type { Types } from 'mongoose';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';

/** Idempotent: rename display name for presetId modern from legacy "Modern" seed label. */
export async function renameModernTemplatesToStacked(organizationId: Types.ObjectId | string) {
  await SignatureTemplateModel.updateMany(
    { organizationId, presetId: 'modern', name: 'Modern' },
    { $set: { name: 'Stacked' } }
  );
}
