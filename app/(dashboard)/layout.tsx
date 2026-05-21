import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { DashboardShell } from '@/components/dashboard/DashboardShell';

export const dynamic = 'force-dynamic';

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/analytics', label: 'Analytics' },
  { href: '/dashboard/employees', label: 'Employees' },
  { href: '/dashboard/signature', label: 'Signature' },
  { href: '/dashboard/billing', label: 'Billing' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session?.user) {
    redirect('/login');
  }
  const user = session.user as { email?: string; organizationId?: string; id?: string };
  const { isPlatformAdmin } = await import('@/lib/auth/platformAdmin');
  const showPlatformAdmin = user.id ? await isPlatformAdmin(user.id) : false;

  return (
    <DashboardShell email={user.email} navLinks={links} showPlatformAdmin={showPlatformAdmin}>
      {children}
    </DashboardShell>
  );
}
