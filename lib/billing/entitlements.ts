import type { OrganizationDoc } from '@/models/Organization';
import { MAX_TEMPLATES_BASIC } from '@/lib/stripe/config';

export type BillingEntitlements = {
  /** Pro-tier product capabilities (templates, animation slots). Driven by `Organization.plan` (kept in sync via Stripe webhooks). */
  isPro: boolean;
  maxTemplates: number;
  /** Org is allowed to use per-template animation when the template requests it. */
  canUseTemplateAnimationSlot: boolean;
};

const PRO_MAX_TEMPLATES = 10;

export function getBillingEntitlements(
  org: Pick<OrganizationDoc, 'plan' | 'subscriptionStatus'> | null | undefined
): BillingEntitlements {
  if (!org) {
    return {
      isPro: false,
      maxTemplates: MAX_TEMPLATES_BASIC,
      canUseTemplateAnimationSlot: false,
    };
  }
  const isPro = org.plan === 'pro';
  return {
    isPro,
    maxTemplates: isPro ? PRO_MAX_TEMPLATES : MAX_TEMPLATES_BASIC,
    canUseTemplateAnimationSlot: isPro,
  };
}

/** True when rendered HTML should include the GIF animation slot for this org + template. */
export function shouldIncludeSignatureAnimation(
  org: Pick<OrganizationDoc, 'plan' | 'subscriptionStatus'> | null | undefined,
  template: { includeAnimationSlot: boolean }
): boolean {
  return getBillingEntitlements(org).canUseTemplateAnimationSlot && Boolean(template.includeAnimationSlot);
}
