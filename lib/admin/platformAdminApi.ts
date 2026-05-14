import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { isPlatformAdmin } from '@/lib/auth/platformAdmin';

/** For API routes: 401/403 or null when the caller is a platform admin. */
export async function requirePlatformAdminApi(): Promise<NextResponse | null> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!(await isPlatformAdmin(session.user.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}
