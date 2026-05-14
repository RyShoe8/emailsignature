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
      <header className="border-b border-border px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Platform admin</h1>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
          Back to dashboard
        </Link>
      </header>
      <div className="p-6 lg:p-8 max-w-5xl">{children}</div>
    </div>
  );
}
