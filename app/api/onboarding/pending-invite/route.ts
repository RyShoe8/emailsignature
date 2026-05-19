import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { findPendingInviteByEmail } from '@/lib/employees/findPendingInviteByEmail';

/** Returns invite token if the signed-in user has a pending employee invite. */
export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ inviteToken: null });
  }
  const user = session.user as { organizationId?: string; email: string };
  if (user.organizationId) {
    return NextResponse.json({ inviteToken: null });
  }

  const employee = await findPendingInviteByEmail(user.email);
  if (!employee?.inviteToken) {
    return NextResponse.json({ inviteToken: null });
  }

  return NextResponse.json({ inviteToken: employee.inviteToken });
}
