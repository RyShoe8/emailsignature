import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { GmailIntegrationModel } from '@/models/GmailIntegration';

type SessionUser = {
  id?: string;
};

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;

  await connectMongoose();
  const row = await GmailIntegrationModel.findOne({ userId: user.id }).lean();
  return NextResponse.json({
    connected: Boolean(row),
    googleEmail: row?.googleEmail || '',
    applyToReplies: row?.applyToReplies !== false,
  });
}
