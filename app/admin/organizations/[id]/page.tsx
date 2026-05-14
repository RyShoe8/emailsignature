import Link from 'next/link';
import { notFound } from 'next/navigation';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { isValidObjectIdString, listUsersInOrganization } from '@/lib/admin/data';
import { AdminOrgUsersPanel } from '@/components/admin/AdminOrgUsersPanel';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminOrganizationDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!isValidObjectIdString(id)) {
    notFound();
  }
  await connectMongoose();
  const org = await OrganizationModel.findById(id);
  if (!org) {
    notFound();
  }
  const users = await listUsersInOrganization(id);

  return (
    <div className="space-y-6">
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4">
        ← Organizations
      </Link>
      <AdminOrgUsersPanel
        organizationId={id}
        organizationName={String(org.name ?? '')}
        initialPlan={String(org.plan ?? 'none')}
        initialUsers={users}
      />
    </div>
  );
}
