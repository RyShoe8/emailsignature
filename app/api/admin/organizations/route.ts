import { NextResponse } from 'next/server';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { listOrganizationsWithUserCounts } from '@/lib/admin/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const organizations = await listOrganizationsWithUserCounts();
  return NextResponse.json({ organizations });
}
