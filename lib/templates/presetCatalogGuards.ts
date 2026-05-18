import { connectMongoose } from '@/lib/mongoose';
import type { CatalogPresetId } from '@/models/SignaturePresetCatalog';
import {
  SignaturePresetCatalogModel,
  type SignaturePresetCatalogDoc,
} from '@/models/SignaturePresetCatalog';
import { countPresetUsageAcrossOrgs } from '@/lib/templates/presetUsage';

export class PresetCatalogGuardError extends Error {
  constructor(
    message: string,
    readonly status: number = 409
  ) {
    super(message);
    this.name = 'PresetCatalogGuardError';
  }
}

export async function countEnabledActivePresets(excludePresetId?: CatalogPresetId): Promise<number> {
  await connectMongoose();
  const filter: Record<string, unknown> = { enabled: true, deletedAt: null };
  if (excludePresetId) {
    filter.presetId = { $ne: excludePresetId };
  }
  return SignaturePresetCatalogModel.countDocuments(filter);
}

/** Block disable/delete when employees still use this preset, or when it is the last enabled preset. */
export async function assertPresetCanBeDisabledOrDeleted(presetId: CatalogPresetId): Promise<void> {
  const remaining = await countEnabledActivePresets(presetId);
  const doc = await SignaturePresetCatalogModel.findOne({ presetId }).lean<SignaturePresetCatalogDoc>();
  if (!doc) {
    throw new PresetCatalogGuardError('Preset not found', 404);
  }
  if (doc.enabled && !doc.deletedAt && remaining === 0) {
    throw new PresetCatalogGuardError('Cannot disable or delete the last enabled template preset.', 409);
  }

  const { employeeCount } = await countPresetUsageAcrossOrgs(presetId);
  if (employeeCount > 0) {
    throw new PresetCatalogGuardError(
      `Cannot disable or delete: ${employeeCount} employee signature(s) still use this preset. Reassign them first.`,
      409
    );
  }
}
