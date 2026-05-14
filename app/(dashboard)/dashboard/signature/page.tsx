import { SignatureWorkspace } from '@/components/dashboard/SignatureWorkspace';

export default function DashboardSignaturePage() {
  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Signature</h1>
        <p className="text-muted-foreground text-sm mt-1">Organization defaults and live preview.</p>
      </div>
      <SignatureWorkspace />
    </div>
  );
}
