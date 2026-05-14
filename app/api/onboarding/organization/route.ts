import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { getAuth } from '@/lib/auth/server';
import { OrganizationModel } from '@/models/Organization';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { seedDefaultTemplates } from '@/lib/seedOrgTemplates';

const BodySchema = z.object({
  name: z.string().min(1).max(120),
});

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as { id: string; organizationId?: string };
  if (user.organizationId) {
    return NextResponse.json({ error: 'Organization already exists' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => i.message).join(' ');
    return NextResponse.json({ error: message || 'Invalid request' }, { status: 400 });
  }

  await connectMongoose();

  const org = await OrganizationModel.create({
    name: parsed.data.name,
    companyName: parsed.data.name,
  });

  await seedDefaultTemplates(org._id);

  try {
    const auth = await getAuth();
    await auth.api.updateUser({
      body: {
        organizationId: org._id.toString(),
        role: 'owner',
      },
      headers: await headers(),
    });
  } catch (err) {
    console.error('[onboarding] updateUser failed', err);
    await SignatureTemplateModel.deleteMany({ organizationId: org._id });
    await OrganizationModel.findByIdAndDelete(org._id);
    return NextResponse.json({ error: 'Could not link organization to your account' }, { status: 500 });
  }

  return NextResponse.json({ organization: org.toObject() });
}
