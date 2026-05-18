import type { ContentBlockData } from 'emailsignature-engine';
import type { SignatureClickKind } from '@/models/SignatureClickEvent';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';

const PROMO_KINDS: SignatureClickKind[] = ['content_block_1', 'content_block_2'];

export type PromoBlockAnalyticsSlot = {
  kind: 'content_block_1' | 'content_block_2';
  label: string;
  description: string;
};

function isContentBlockData(b: unknown): b is ContentBlockData {
  return typeof b === 'object' && b !== null && 'type' in b && 'enabled' in b;
}

export function contentBlockDisplayLabel(block: ContentBlockData, slotIndex: number): string {
  const title =
    block.listTitle?.trim() ||
    block.callTitle?.trim() ||
    block.customTitle?.trim() ||
    '';
  if (title) return title;

  switch (block.type) {
    case 'book_a_call':
      return 'Book a call';
    case 'latest_blogs':
      return 'Latest blogs';
    case 'image':
      return 'Image promo';
    case 'list':
      return 'Promo list';
    case 'custom':
      return 'Promo block';
    default:
      return `Promo block ${slotIndex + 1}`;
  }
}

export function contentBlockClickDescription(block: ContentBlockData): string {
  switch (block.type) {
    case 'book_a_call':
      return 'Book-a-call button and link clicks';
    case 'latest_blogs':
      return 'Blog item link clicks in this block';
    case 'image':
      return 'Promo image link clicks';
    case 'list':
    case 'custom':
      return 'List item and promo link clicks in this block';
    default:
      return 'Promotional link clicks in this block';
  }
}

/**
 * Slots to show on Overview analytics when any employee has that block enabled.
 */
export async function getOrgEnabledPromoBlockSlots(
  organizationId: string
): Promise<PromoBlockAnalyticsSlot[]> {
  await connectMongoose();
  const employees = await EmployeeModel.find({ organizationId })
    .select('contentBlocks')
    .lean<{ contentBlocks?: unknown[] }[]>();

  const slots: PromoBlockAnalyticsSlot[] = [];

  for (let index = 0; index < PROMO_KINDS.length; index += 1) {
    const kind = PROMO_KINDS[index] as 'content_block_1' | 'content_block_2';
    let label: string | null = null;
    let description: string | null = null;

    for (const emp of employees) {
      const blocks = emp.contentBlocks;
      if (!Array.isArray(blocks)) continue;
      const raw = blocks[index];
      if (!isContentBlockData(raw) || !raw.enabled) continue;
      if (!label) {
        label = contentBlockDisplayLabel(raw, index);
        description = contentBlockClickDescription(raw);
      }
    }

    if (label && description) {
      slots.push({ kind, label, description });
    }
  }

  return slots;
}
