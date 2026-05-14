import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { isValidObjectIdString } from '@/lib/admin/data';
import { OrganizationModel } from '@/models/Organization';
import { connectMongoose } from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  plan: z.enum(['none', 'basic', 'pro']).optional(),
  subscriptionStatus: z
    .enum(['none', 'active', 'trialing', 'past_due', 'canceled', 'incomplete'])
    .optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectIdString(id)) {
    return NextResponse.json({ error: 'Invalid organization id' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(' ') }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  await connectMongoose();
  const org = await OrganizationModel.findByIdAndUpdate(id, { $set: parsed.data }, { new: true }).lean();
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  return NextResponse.json({ organization: org });
}
