import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { UserSignatureProfileModel } from '@/models/UserSignatureProfile';

const ProfileSchema = z.object({
  firstName: z.string().trim().max(120),
  lastName: z.string().trim().max(120),
  title: z.string().trim().max(200),
  email: z.string().trim().email().max(320),
  officePhone: z.string().trim().max(80).optional(),
  mobilePhone: z.string().trim().max(80).optional(),
});

type SessionUser = {
  id?: string;
};

function docToProfile(doc: {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  officePhone?: string;
  mobilePhone?: string;
}) {
  return {
    firstName: doc.firstName,
    lastName: doc.lastName,
    title: doc.title,
    email: doc.email,
    officePhone: doc.officePhone ?? '',
    mobilePhone: doc.mobilePhone ?? '',
  };
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;

  await connectMongoose();
  const row = await UserSignatureProfileModel.findOne({ userId: user.id }).lean();
  if (!row) {
    return NextResponse.json({ profile: null });
  }
  return NextResponse.json({ profile: docToProfile(row) });
}

export async function PATCH(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = ProfileSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map((i) => i.message).join(' ') }, { status: 400 });
  }

  const p = parsed.data;
  await connectMongoose();
  const row = await UserSignatureProfileModel.findOneAndUpdate(
    { userId: user.id },
    {
      userId: user.id,
      firstName: p.firstName,
      lastName: p.lastName,
      title: p.title,
      email: p.email,
      officePhone: p.officePhone ?? '',
      mobilePhone: p.mobilePhone ?? '',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  if (!row) {
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
  return NextResponse.json({ profile: docToProfile(row) });
}
