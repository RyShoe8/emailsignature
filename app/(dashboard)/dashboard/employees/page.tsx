import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { Button } from '@/components/ui/button';
import { getEmployeeLimitsForOrganization } from '@/lib/billing/employeeLimits';
import { EmployeeInviteBadge } from '@/components/dashboard/EmployeeInviteBadge';

export default async function EmployeesPage() {
  const session = await getServerSession();
  if (!session?.user) redirect('/login');
  const user = session.user as { organizationId?: string };
  if (!user.organizationId) redirect('/onboarding');
  await connectMongoose();
  const [employees, limits] = await Promise.all([
    EmployeeModel.find({ organizationId: user.organizationId })
      .sort({ createdAt: -1 })
      .lean(),
    getEmployeeLimitsForOrganization(user.organizationId),
  ]);

  const limitMessage =
    !limits.canAddMore && limits.maxEmployees !== null
      ? `Your plan includes ${limits.maxEmployees} user${limits.maxEmployees === 1 ? '' : 's'}. Choose a plan with additional users on Billing to add more.`
      : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add team members by email and edit their signature details.</p>
        </div>
        {limits.canAddMore ? (
          <Button asChild className="shrink-0 self-start sm:self-auto">
            <Link href="/dashboard/employees/new">Add employee</Link>
          </Button>
        ) : (
          <Button disabled className="shrink-0 self-start sm:self-auto">
            Add employee
          </Button>
        )}
      </div>
      {limitMessage ? (
        <p className="text-sm text-muted-foreground rounded-md border border-dashed p-3">{limitMessage}</p>
      ) : null}
      <div className="border rounded-lg divide-y">
        {employees.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No employees yet.</p>
        ) : (
          employees.map((e) => (
            <Link
              key={String(e._id)}
              href={`/dashboard/employees/${e._id}`}
              className="flex items-center justify-between gap-3 p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {e.firstName} {e.lastName}
                </p>
                <p className="truncate text-sm text-muted-foreground">{e.email}</p>
              </div>
              <EmployeeInviteBadge
                employee={{
                  inviteSentAt: e.inviteSentAt as Date | string | null | undefined,
                  inviteAcceptedAt: e.inviteAcceptedAt as Date | string | null | undefined,
                }}
              />
              <span className="shrink-0 text-xs text-muted-foreground">Edit</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
