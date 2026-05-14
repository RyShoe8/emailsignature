import mongoose, { Schema } from 'mongoose';

const GmailIntegrationSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    encryptedRefreshToken: { type: String, required: true },
    googleEmail: { type: String, default: '' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export type GmailIntegrationDoc = mongoose.InferSchemaType<typeof GmailIntegrationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const GmailIntegrationModel: mongoose.Model<GmailIntegrationDoc> =
  (mongoose.models.GmailIntegration as mongoose.Model<GmailIntegrationDoc> | undefined) ??
  mongoose.model<GmailIntegrationDoc>('GmailIntegration', GmailIntegrationSchema);
