import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const EmployeeSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    title: { type: String, default: '', trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    website: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    /** References SignatureTemplate doc _id */
    templateId: { type: Schema.Types.ObjectId, ref: 'SignatureTemplate', required: true },
    previewToken: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

EmployeeSchema.index({ organizationId: 1, email: 1 }, { unique: true });

export type EmployeeDoc = InferSchemaType<typeof EmployeeSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const EmployeeModel =
  mongoose.models.Employee ?? mongoose.model('Employee', EmployeeSchema);
