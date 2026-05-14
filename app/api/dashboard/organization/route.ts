import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';

type SessionUser = {
  id?: string;
  organizationId?: string;
  role?: string;
};

const PATCHABLE_FIELDS = [
  'name',
  'logoUrl',
  'primaryColor',
  'website',
  'companyName',
  'fontFamily',
  'logoLink',
  'socialLinks',
  'locations',
  'warehouseAddress',
  'animation',
  'signatureClickTrackingEnabled',
] as const;

type PatchableField = (typeof PATCHABLE_FIELDS)[number];

function isPatchableField(key: string): key is PatchableField {
  return (PATCHABLE_FIELDS as readonly string[]).includes(key);
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ organization: null });
  }
  await connectMongoose();
  const organization = await OrganizationModel.findById(user.organizationId).lean();
  return NextResponse.json({ organization });
}

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }
  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  if (user.role !== 'owner' && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const $set: Record<string, unknown> = {};
  for (const key of Object.keys(body)) {
    if (!isPatchableField(key)) continue;
    const value = body[key];
    if (value !== undefined) {
      $set[key] = value;
    }
  }

  if (Object.keys($set).length === 0) {
    return NextResponse.json({ organization: org.toObject() });
  }

  const updated = await OrganizationModel.findByIdAndUpdate(user.organizationId, { $set }, { new: true }).lean();
  if (!updated) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  return NextResponse.json({ organization: updated });
}
