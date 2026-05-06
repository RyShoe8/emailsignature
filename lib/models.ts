import type { ObjectId } from 'mongodb';
import type { SignatureBrand, SignatureTemplate } from 'emailsignature-engine';

export interface User {
  _id?: ObjectId;
  email: string;
  password: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

/** Single org-wide row for the email signature builder (brand + template). */
export interface SignatureOrgSettings {
  _id?: ObjectId;
  scope?: 'organization';
  brand: SignatureBrand;
  template: SignatureTemplate;
  updatedAt: Date;
}
