import { NextResponse } from 'next/server';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { listFeedbackSubmissions } from '@/lib/admin/feedback';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const submissions = await listFeedbackSubmissions(status ?? undefined);
  return NextResponse.json({ submissions });
}
