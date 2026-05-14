import type { OrganizationDoc } from '@/models/Organization';

export function canUsePaidFeatures(org: OrganizationDoc | null): boolean {
  if (!org) return false;
  if (!process.env.STRIPE_SECRET_KEY) return true;
  return org.subscriptionStatus === 'active' || org.subscriptionStatus === 'trialing';
}

export function isProPlan(org: OrganizationDoc | null): boolean {
  return org?.plan === 'pro';
}
