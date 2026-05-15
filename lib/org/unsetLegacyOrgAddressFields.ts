import type { Types } from 'mongoose';
import { OrganizationModel } from '@/models/Organization';

/** Remove Senior-by-Design location fields; do not migrate values into new address fields. */
export async function unsetLegacyOrgAddressFields(organizationId: Types.ObjectId | string) {
  await OrganizationModel.updateOne(
    { _id: organizationId },
    { $unset: { locations: '', warehouseAddress: '' } }
  );
}
