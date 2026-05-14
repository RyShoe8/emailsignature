import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const OrganizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    logoUrl: { type: String, default: '' },
    primaryColor: { type: String, default: '#0a0a0a' },
    website: { type: String, default: '' },
    plan: { type: String, enum: ['basic', 'pro', 'none'], default: 'none' },
    stripeCustomerId: { type: String, default: '' },
    stripeSubscriptionId: { type: String, default: '' },
    subscriptionStatus: {
      type: String,
      enum: ['none', 'active', 'trialing', 'past_due', 'canceled', 'incomplete'],
      default: 'none',
    },
    /** Org-wide brand fields for signature engine */
    companyName: { type: String, default: '' },
    fontFamily: { type: String, default: 'Arial' },
    logoLink: { type: String, default: '' },
    socialLinks: {
      linkedin: { type: String },
      facebook: { type: String },
      instagram: { type: String },
      reddit: { type: String },
    },
    locations: {
      dallas: { type: String },
      boulder: { type: String },
    },
    warehouseAddress: { type: String },
    animation: {
      enabled: { type: Boolean, default: false },
      gifUrl: { type: String },
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type OrganizationDoc = InferSchemaType<typeof OrganizationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const OrganizationModel =
  mongoose.models.Organization ?? mongoose.model('Organization', OrganizationSchema);
