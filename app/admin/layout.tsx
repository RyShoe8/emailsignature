import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { isPlatformAdmin } from '@/lib/auth/platformAdmin';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    redirect('/login');
  }
  if (!(await isPlatformAdmin(session.user.id))) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <h1 className="text-lg font-semibold tracking-tight">Platform admin</h1>
          <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground hover:underline underline-offset-4">
              Organizations
            </Link>
            <Link href="/admin/plans" className="hover:text-foreground hover:underline underline-offset-4">
              Plans
            </Link>
            <Link href="/admin/plans/archived" className="hover:text-foreground hover:underline underline-offset-4">
              Archived plans
            </Link>
            <Link href="/admin/addons" className="hover:text-foreground hover:underline underline-offset-4">
              Add-ons
            </Link>
          </nav>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Back to dashboard
        </Link>
      </header>
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
