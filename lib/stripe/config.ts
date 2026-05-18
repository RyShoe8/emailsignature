/**
 * Stripe price IDs — set in env; edit amounts in Stripe Dashboard without code changes.
 */
export const stripePriceIds = {
  basic: process.env.STRIPE_BASIC_PRICE_ID ?? '',
  pro: process.env.STRIPE_PRO_PRICE_ID ?? '',
} as const;

/** Matches the four built-in presets (minimal, stacked, corporate, professional). */
export const MAX_TEMPLATES_BASIC = 4;
