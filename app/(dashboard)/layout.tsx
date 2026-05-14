import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { TailnoteLogo } from '@/components/brand/TailnoteLogo';
import { SignOutButton } from '@/components/dashboard/SignOutButton';

export const dynamic = 'force-dynamic';

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/employees', label: 'Employees' },
  { href: '/dashboard/templates', label: 'Templates' },
  { href: '/dashboard/signature', label: 'Signature' },
  { href: '/dashboard/billing', label: 'Billing' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/login');
  }
  const user = session.user as { email?: string; organizationId?: string };

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 border-r bg-muted/20 p-4 flex flex-col gap-6">
        <div>
          <Link href="/dashboard" className="block shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm">
            <TailnoteLogo heightClass="h-7" />
          </Link>
          {user.email && <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>}
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto">
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6 lg:p-10">{children}</main>
    </div>
  );
}
