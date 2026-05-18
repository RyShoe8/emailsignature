import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { renameModernTemplatesToStacked } from '@/lib/email/renameModernTemplates';
import { ensureOrgPresetTemplates } from '@/lib/seedOrgTemplates';
import { getEnabledPresetIds } from '@/lib/templates/getEnabledPresets';

type SessionUser = { organizationId?: string };

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ templates: [] });
  }
  await connectMongoose();
  await renameModernTemplatesToStacked(user.organizationId);
  await ensureOrgPresetTemplates(user.organizationId);

  const enabledIds = await getEnabledPresetIds();
  const enabledList = [...enabledIds];

  const templates = await SignatureTemplateModel.find({
    organizationId: user.organizationId,
    presetId: { $in: enabledList },
  })
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json({ templates });
}
