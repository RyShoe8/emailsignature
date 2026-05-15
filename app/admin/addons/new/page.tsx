import Link from 'next/link';
import { AdminAddonForm } from '@/components/admin/AdminAddonForm';

export const dynamic = 'force-dynamic';

export default function NewAdminAddonPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/addons"
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        ← Add-ons
      </Link>
      <AdminAddonForm mode="create" />
    </div>
  );
}
