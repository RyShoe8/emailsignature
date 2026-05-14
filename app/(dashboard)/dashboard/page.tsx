import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardHomePage() {
  const session = await getServerSession();
  if (!session?.user) redirect('/login');
  const user = session.user as { organizationId?: string };
  if (!user.organizationId) {
    redirect('/onboarding');
  }
  await connectMongoose();
  const [employees, templates] = await Promise.all([
    EmployeeModel.countDocuments({ organizationId: user.organizationId }),
    SignatureTemplateModel.countDocuments({ organizationId: user.organizationId }),
  ]);

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">Manage signatures and billing from the sidebar.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employees</CardTitle>
            <CardDescription>People with a hosted preview and exportable HTML.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{employees}</p>
            <Link href="/dashboard/employees" className="text-sm text-muted-foreground underline underline-offset-4 mt-2 inline-block">
              Manage
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Minimal, Modern, and Corporate presets.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{templates}</p>
            <Link href="/dashboard/templates" className="text-sm text-muted-foreground underline underline-offset-4 mt-2 inline-block">
              View
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
