import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { acceptEmployeeInvite } from '@/lib/employees/acceptEmployeeInvite';

type RouteParams = { params: Promise<{ token: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const session = await getServerSession();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  const user = session.user as {
    id: string;
    email: string;
    organizationId?: string | null;
  };

  const result = await acceptEmployeeInvite(token, {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, redirect: result.redirect });
}
