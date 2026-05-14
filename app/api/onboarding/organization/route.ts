import { NextResponse } from 'next/server';
import { z } from 'zod';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { OrganizationModel } from '@/models/Organization';
import { setUserOrganizationId } from '@/lib/auth/userOrg';
import { seedDefaultTemplates } from '@/lib/seedOrgTemplates';

const BodySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(2)
    .max(48)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await connectMongoose();
  const exists = await OrganizationModel.findOne({ slug: parsed.data.slug });
  if (exists) {
    return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
  }

  const org = await OrganizationModel.create({
    name: parsed.data.name,
    slug: parsed.data.slug,
    companyName: parsed.data.name,
  });

  await seedDefaultTemplates(org._id);
  await setUserOrganizationId(user.id, org._id.toString());

  return NextResponse.json({ organization: org.toObject() });
}
