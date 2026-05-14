import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { SignatureClickEventModel } from '@/models/SignatureClickEvent';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

type SessionUser = { organizationId?: string };

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 30));
  const since = new Date(Date.now() - days * 864e5);

  await connectMongoose();
  const oid = new mongoose.Types.ObjectId(user.organizationId);

  const agg = await SignatureClickEventModel.aggregate<{ _id: string; count: number }>([
    { $match: { organizationId: oid, createdAt: { $gte: since } } },
    { $group: { _id: '$kind', count: { $sum: 1 } } },
  ]);

  const byKind: Record<string, number> = {};
  for (const row of agg) {
    byKind[row._id] = row.count;
  }

  return NextResponse.json({ days, since: since.toISOString(), byKind });
}
