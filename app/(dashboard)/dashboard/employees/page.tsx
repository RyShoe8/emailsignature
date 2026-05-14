import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { Button } from '@/components/ui/button';

export default async function EmployeesPage() {
  const session = await getServerSession();
  if (!session?.user) redirect('/login');
  const user = session.user as { organizationId?: string };
  if (!user.organizationId) redirect('/onboarding');
  await connectMongoose();
  const employees = await EmployeeModel.find({ organizationId: user.organizationId })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-muted-foreground text-sm mt-1">Create and edit team members and assign templates.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/employees/new">Add employee</Link>
        </Button>
      </div>
      <div className="border rounded-lg divide-y">
        {employees.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">No employees yet.</p>
        ) : (
          employees.map((e) => (
            <Link
              key={String(e._id)}
              href={`/dashboard/employees/${e._id}`}
              className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
            >
              <div>
                <p className="font-medium">
                  {e.firstName} {e.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{e.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">Edit</span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
