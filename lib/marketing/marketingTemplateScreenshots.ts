import type { TemplatePresetId } from '@/lib/email/templatePresets';

export const MARKETING_TEMPLATE_SCREENSHOTS: Record<TemplatePresetId, string> = {
  default: '/images/marketing/templates/corporate.png',
  creator: '/images/marketing/templates/corporate.png',
  executive_minimalist: '/images/marketing/templates/minimal.png',
  minimal: '/images/marketing/templates/minimal.png',
  modern: '/images/marketing/templates/stacked.png',
  corporate: '/images/marketing/templates/corporate.png',
  professional: '/images/marketing/templates/professional.png',
};

export function marketingTemplateScreenshotPath(presetId: TemplatePresetId): string {
  return MARKETING_TEMPLATE_SCREENSHOTS[presetId];
}
