import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { requireOrgAdmin } from '@/lib/dashboard/requireOrgAdmin';
import { sendEmployeeInvite } from '@/lib/employees/sendEmployeeInvite';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const ctx = await requireOrgAdmin();
  if ('error' in ctx) return ctx.error;
  const { org, user } = ctx;
  const { id } = await params;

  await connectMongoose();
  const employee = await EmployeeModel.findOne({
    _id: id,
    organizationId: user.organizationId,
  });
  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  if (employee.inviteAcceptedAt) {
    return NextResponse.json({ error: 'Invite already accepted' }, { status: 400 });
  }

  const result = await sendEmployeeInvite(
    {
      _id: employee._id,
      email: employee.email,
      inviteToken: employee.inviteToken,
      inviteExpiresAt: employee.inviteExpiresAt,
      inviteAcceptedAt: employee.inviteAcceptedAt,
    },
    org
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const updated = await EmployeeModel.findById(employee._id)
    .select('inviteSentAt')
    .lean<{ inviteSentAt?: Date } | null>();

  return NextResponse.json({
    ok: true,
    inviteEmailSent: true,
    inviteSentAt: updated?.inviteSentAt ?? new Date(),
    devLogged: result.devLogged,
  });
}
