import mongoose, { Schema } from 'mongoose';

const GmailIntegrationSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    encryptedRefreshToken: { type: String, required: true },
    googleEmail: { type: String, default: '' },
    /** User preference: also use signature on replies/forwards (Gmail UI may still need manual default). */
    applyToReplies: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type GmailIntegrationDoc = mongoose.InferSchemaType<typeof GmailIntegrationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const GmailIntegrationModel: mongoose.Model<GmailIntegrationDoc> =
  (mongoose.models.GmailIntegration as mongoose.Model<GmailIntegrationDoc> | undefined) ??
  mongoose.model<GmailIntegrationDoc>('GmailIntegration', GmailIntegrationSchema);
