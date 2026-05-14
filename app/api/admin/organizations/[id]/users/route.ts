import { NextResponse } from 'next/server';
import { requirePlatformAdminApi } from '@/lib/admin/platformAdminApi';
import { isValidObjectIdString, listUsersInOrganization } from '@/lib/admin/data';
import { OrganizationModel } from '@/models/Organization';
import { connectMongoose } from '@/lib/mongoose';

export const dynamic = 'force-dynamic';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const denied = await requirePlatformAdminApi();
  if (denied) return denied;
  const { id } = await params;
  if (!isValidObjectIdString(id)) {
    return NextResponse.json({ error: 'Invalid organization id' }, { status: 400 });
  }
  await connectMongoose();
  const org = await OrganizationModel.findById(id);
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  const users = await listUsersInOrganization(id);
  return NextResponse.json({ organizationId: id, organizationName: org.name, users });
}
