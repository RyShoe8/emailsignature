import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel, type EmployeeDoc } from '@/models/Employee';
import { OrganizationModel, type OrganizationDoc } from '@/models/Organization';
import { isInviteExpired } from '@/lib/employees/inviteToken';

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  await connectMongoose();
  const employee = await EmployeeModel.findOne({ inviteToken: token }).lean<EmployeeDoc | null>();
  if (!employee) {
    return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
  }

  const org = await OrganizationModel.findById(employee.organizationId).lean<OrganizationDoc | null>();
  const orgName = org?.companyName?.trim() || org?.name?.trim() || 'your team';
  const expired = isInviteExpired(employee.inviteExpiresAt);
  const alreadyAccepted = Boolean(employee.inviteAcceptedAt);

  return NextResponse.json({
    orgName,
    email: employee.email,
    alreadyAccepted,
    expired,
    employeeFirstName: employee.firstName,
  });
}
