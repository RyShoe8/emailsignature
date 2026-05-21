import { NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongoose';
import { getServerSession } from '@/lib/auth/session';
import { SignatureClickEventModel } from '@/models/SignatureClickEvent';
import { EmployeeModel } from '@/models/Employee';
import { resolveViewerEmployeeId } from '@/lib/analytics/resolveViewerEmployee';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

type SessionUser = { id?: string; organizationId?: string; role?: string };

const MAX_RANGE_DAYS = 90;

function parseDateParam(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

export async function GET(request: Request) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as SessionUser;
  if (!user.organizationId || !user.id) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  const url = new URL(request.url);
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 864e5);
  let from = parseDateParam(url.searchParams.get('from'), defaultFrom);
  let to = parseDateParam(url.searchParams.get('to'), now);
  if (from > to) {
    const tmp = from;
    from = to;
    to = tmp;
  }
  const rangeMs = to.getTime() - from.getTime();
  if (rangeMs > MAX_RANGE_DAYS * 864e5) {
    from = new Date(to.getTime() - MAX_RANGE_DAYS * 864e5);
  }

  const isOwnerOrAdmin = user.role === 'owner' || user.role === 'admin';
  const requestedEmployeeId = url.searchParams.get('employeeId')?.trim() || '';

  await connectMongoose();
  const oid = new mongoose.Types.ObjectId(user.organizationId);

  let filterEmployeeId: mongoose.Types.ObjectId | undefined;

  if (isOwnerOrAdmin) {
    if (requestedEmployeeId) {
      const emp = await EmployeeModel.findOne({
        _id: requestedEmployeeId,
        organizationId: oid,
      })
        .select('_id')
        .lean<{ _id: mongoose.Types.ObjectId }>();
      if (!emp?._id) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
      filterEmployeeId = new mongoose.Types.ObjectId(String(emp._id));
    }
  } else {
    const viewerEmpId = await resolveViewerEmployeeId({
      organizationId: user.organizationId,
      userId: user.id,
    });
    if (!viewerEmpId) {
      return NextResponse.json({
        from: from.toISOString(),
        to: to.toISOString(),
        scope: 'self',
        byKind: {},
        byDay: [],
        employees: [],
      });
    }
    filterEmployeeId = viewerEmpId;
  }

  const match: Record<string, unknown> = {
    organizationId: oid,
    createdAt: { $gte: from, $lte: to },
  };
  if (filterEmployeeId) {
    match.employeeId = filterEmployeeId;
  }

  const [byKindAgg, byDayAgg, employees] = await Promise.all([
    SignatureClickEventModel.aggregate<{ _id: string; count: number }>([
      { $match: match },
      { $group: { _id: '$kind', count: { $sum: 1 } } },
    ]),
    SignatureClickEventModel.aggregate<{ _id: string; count: number }>([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    isOwnerOrAdmin
      ? EmployeeModel.find({ organizationId: oid })
          .select('firstName lastName email')
          .sort({ firstName: 1, lastName: 1 })
          .lean()
      : Promise.resolve([]),
  ]);

  const byKind: Record<string, number> = {};
  for (const row of byKindAgg) {
    byKind[row._id] = row.count;
  }

  const byDay = byDayAgg.map((row) => ({ date: row._id, count: row.count }));

  return NextResponse.json({
    from: from.toISOString(),
    to: to.toISOString(),
    scope: isOwnerOrAdmin ? (filterEmployeeId ? 'employee' : 'organization') : 'self',
    employeeId: filterEmployeeId?.toString(),
    byKind,
    byDay,
    employees: employees.map((e) => ({
      id: String(e._id),
      name: [e.firstName, e.lastName].filter(Boolean).join(' ').trim() || e.email,
      email: e.email,
    })),
    canFilterByEmployee: isOwnerOrAdmin,
  });
}
