import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { ensureOwnerEmployeeForOrganization } from '@/lib/employees/ensureOwnerEmployee';

export async function resolveViewerEmployeeId(args: {
  organizationId: string;
  userId: string;
}): Promise<mongoose.Types.ObjectId | null> {
  await connectMongoose();
  await ensureOwnerEmployeeForOrganization(args.organizationId);
  const oid = new mongoose.Types.ObjectId(args.organizationId);
  const row = await EmployeeModel.findOne({
    organizationId: oid,
    userId: args.userId,
  })
    .select('_id')
    .lean<{ _id: mongoose.Types.ObjectId }>();
  return row?._id ? new mongoose.Types.ObjectId(String(row._id)) : null;
}
