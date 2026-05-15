import type { SignatureElement, SignatureTemplate, SignatureLayout } from 'emailsignature-engine';

export type TemplatePresetId = 'minimal' | 'modern' | 'corporate';

export type TemplatePresetMeta = {
  id: TemplatePresetId;
  name: string;
  description: string;
};

export const TEMPLATE_PRESET_META: TemplatePresetMeta[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Logo, name, title, contact, and optional social icons when links are set—compact.',
  },
  {
    id: 'modern',
    name: 'Stacked',
    description: 'Stacked layout with optional social and divider.',
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Premium layout with accent bars, branded footer, circular social icons, and promotional content blocks.',
  },
];

function elementsMinimal(): SignatureElement[] {
  return [{ type: 'logo' }, { type: 'name' }, { type: 'title' }, { type: 'contact' }, { type: 'social' }];
}

function elementsModern(): SignatureElement[] {
  return [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
    { type: 'social' },
    { type: 'divider' },
  ];
}

function elementsCorporate(): SignatureElement[] {
  return [
    { type: 'logo' },
    { type: 'name' },
    { type: 'title' },
    { type: 'contact' },
    { type: 'social' },
    { type: 'divider' },
    { type: 'address' },
    { type: 'contentBlocks' },
  ];
}

/**
 * Resolves a named preset to engine `SignatureTemplate` (no HTML in DB).
 * `templateDocId` is the Mongo id string of the org template row when persisted.
 */
export function presetToEngineTemplate(
  presetId: TemplatePresetId,
  templateDocId: string,
  displayName?: string
): SignatureTemplate {
  switch (presetId) {
    case 'minimal':
      return {
        id: templateDocId,
        name: displayName ?? 'Minimal',
        layout: 'standard',
        elements: elementsMinimal(),
      };
    case 'modern':
      return {
        id: templateDocId,
        name: displayName ?? 'Stacked',
        layout: 'stacked',
        elements: elementsModern(),
      };
    case 'corporate':
    default:
      return {
        id: templateDocId,
        name: displayName ?? 'Corporate',
        layout: 'corporate',
        elements: elementsCorporate(),
      };
  }
}

export function engineTemplateFromStoredConfig(args: {
  templateId: string;
  name: string;
  presetId: TemplatePresetId;
  /** When true (Pro), allow animation block if org enables GIF. */
  includeAnimationSlot?: boolean;
}): SignatureTemplate {
  const base = presetToEngineTemplate(args.presetId, args.templateId, args.name);
  if (!args.includeAnimationSlot) return base;
  return {
    ...base,
    elements: [...base.elements, { type: 'animation' }],
  };
}
