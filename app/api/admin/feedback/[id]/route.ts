import { NextResponse } from 'next/server';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { getFeedbackSubmission, updateFeedbackStatus } from '@/lib/admin/feedback';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  const submission = await getFeedbackSubmission(id);
  if (!submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ submission });
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;

  const { id } = await context.params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const status = body.status;
  if (status !== 'new' && status !== 'read' && status !== 'closed') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const submission = await updateFeedbackStatus(id, status);
  if (!submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ submission });
}
