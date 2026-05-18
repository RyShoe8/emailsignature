import { connectMongoose } from '@/lib/mongoose';
import type { CatalogPresetId } from '@/models/SignaturePresetCatalog';
import { EmployeeModel } from '@/models/Employee';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';

export async function countPresetUsageAcrossOrgs(presetId: CatalogPresetId): Promise<{
  employeeCount: number;
  orgTemplateCount: number;
}> {
  await connectMongoose();
  const orgTemplates = await SignatureTemplateModel.find({ presetId }).select('_id').lean();
  const templateIds = orgTemplates.map((t) => t._id);
  const employeeCount =
    templateIds.length > 0
      ? await EmployeeModel.countDocuments({ templateId: { $in: templateIds } })
      : 0;
  return {
    employeeCount,
    orgTemplateCount: orgTemplates.length,
  };
}
