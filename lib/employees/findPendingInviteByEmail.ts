import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { isInviteExpired } from '@/lib/employees/inviteToken';

export async function findPendingInviteByEmail(email: string) {
  await connectMongoose();
  const normalized = email.trim().toLowerCase();
  const employee = await EmployeeModel.findOne({
    email: normalized,
    inviteToken: { $exists: true, $nin: [null, ''] },
    $or: [{ inviteAcceptedAt: { $exists: false } }, { inviteAcceptedAt: null }],
  }).sort({ inviteSentAt: -1, createdAt: -1 });

  if (!employee?.inviteToken) return null;
  if (employee.inviteAcceptedAt) return null;
  if (isInviteExpired(employee.inviteExpiresAt)) return null;

  return employee;
}
