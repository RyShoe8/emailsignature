import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const SignatureTemplateSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    /** minimal | modern | corporate — maps to engine via presets */
    presetId: { type: String, enum: ['minimal', 'modern', 'corporate'], required: true },
    /** Pro-only: allow animation element in engine template */
    includeAnimationSlot: { type: Boolean, default: false },
    /** Structured config; reserved for future constrained fields */
    config: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

SignatureTemplateSchema.index({ organizationId: 1, name: 1 });

export type SignatureTemplateDoc = InferSchemaType<typeof SignatureTemplateSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SignatureTemplateModel =
  mongoose.models.SignatureTemplate ??
  mongoose.model('SignatureTemplate', SignatureTemplateSchema);
