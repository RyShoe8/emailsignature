import Link from 'next/link';
import { redirect } from 'next/navigation';
import mongoose from 'mongoose';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { SignatureTemplateModel } from '@/models/SignatureTemplate';
import { SignatureClickEventModel } from '@/models/SignatureClickEvent';
import { OrganizationModel } from '@/models/Organization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OverviewOrganizationCard } from '@/components/dashboard/OverviewOrganizationCard';

function sumKinds(byKind: Record<string, number>, keys: string[]) {
  return keys.reduce((acc, k) => acc + (byKind[k] ?? 0), 0);
}

export default async function DashboardHomePage() {
  const session = await getServerSession();
  if (!session?.user) redirect('/login');
  const user = session.user as { organizationId?: string; role?: string };
  if (!user.organizationId) {
    redirect('/onboarding');
  }
  await connectMongoose();
  const oid = new mongoose.Types.ObjectId(user.organizationId);
  const since30 = new Date(Date.now() - 30 * 86400000);

  const [employees, templates, clickAgg, orgDoc] = await Promise.all([
    EmployeeModel.countDocuments({ organizationId: user.organizationId }),
    SignatureTemplateModel.countDocuments({ organizationId: user.organizationId }),
    SignatureClickEventModel.aggregate<{ _id: string; count: number }>([
      { $match: { organizationId: oid, createdAt: { $gte: since30 } } },
      { $group: { _id: '$kind', count: { $sum: 1 } } },
    ]),
    OrganizationModel.findById(user.organizationId),
  ]);

  if (!orgDoc) {
    redirect('/onboarding');
  }

  const canEdit = user.role === 'owner' || user.role === 'admin';
  const trackingOn = orgDoc.signatureClickTrackingEnabled !== false;

  const byKind: Record<string, number> = {};
  for (const row of clickAgg) {
    byKind[row._id] = row.count;
  }

  const logoClicks = byKind.logo ?? 0;
  const websiteClicks = byKind.website ?? 0;
  const phoneClicks = sumKinds(byKind, ['office_phone', 'mobile_phone']);
  const socialClicks = sumKinds(byKind, [
    'social_linkedin',
    'social_facebook',
    'social_instagram',
    'social_reddit',
  ]);
  const emailClicks = byKind.email ?? 0;

  return (
    <div className="mx-auto min-w-0 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-muted-foreground">
          Manage signatures and billing from the navigation (sidebar on desktop, menu on mobile).
        </p>
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
            <CardDescription>Minimal, Stacked, and Corporate presets.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{templates}</p>
            <Link href="/dashboard/templates" className="text-sm text-muted-foreground underline underline-offset-4 mt-2 inline-block">
              View
            </Link>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-1">Signature clicks (last 30 days)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Counts when recipients follow links in sent signatures. Tracking is on by default; turn it off in the
          Organization section below if you do not want click logging.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>Logo link clicks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{logoClicks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Website</CardTitle>
              <CardDescription>Website URL in signature</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{websiteClicks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Email</CardTitle>
              <CardDescription>mailto: link clicks</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{emailClicks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Phone</CardTitle>
              <CardDescription>Office + mobile tel: links</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{phoneClicks}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Social</CardTitle>
              <CardDescription>LinkedIn, Facebook, Instagram, Reddit</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{socialClicks}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <OverviewOrganizationCard
        organizationId={orgDoc._id.toString()}
        initialName={String(orgDoc.name ?? '')}
        initialSignatureClickTrackingEnabled={trackingOn}
        canEdit={canEdit}
      />
    </div>
  );
}
