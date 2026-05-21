import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/session';
import { SignatureAnalyticsClient } from '@/components/dashboard/SignatureAnalyticsClient';

export default async function AnalyticsPage() {
  const session = await getServerSession();
  if (!session?.user) redirect('/login');
  const user = session.user as { organizationId?: string };
  if (!user.organizationId) redirect('/onboarding');

  return <SignatureAnalyticsClient />;
}
