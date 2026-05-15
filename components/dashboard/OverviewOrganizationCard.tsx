'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export type OverviewOrganizationCardProps = {
  organizationId: string;
  initialName: string;
  initialSignatureClickTrackingEnabled: boolean;
  canEdit: boolean;
};

export function OverviewOrganizationCard({
  organizationId,
  initialName,
  initialSignatureClickTrackingEnabled,
  canEdit,
}: OverviewOrganizationCardProps) {
  const [name, setName] = useState(initialName);
  const [signatureClickTrackingEnabled, setSignatureClickTrackingEnabled] = useState(
    initialSignatureClickTrackingEnabled
  );
  const [message, setMessage] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setMessage(null);
    const res = await fetch('/api/dashboard/organization', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, signatureClickTrackingEnabled }),
    });
    if (res.ok) setMessage('Saved');
    else {
      const j = await res.json().catch(() => ({}));
      setMessage(typeof j.error === 'string' ? j.error : 'Could not save');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization</CardTitle>
        <CardDescription>Name, ID, and signature link analytics.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-id">Organization ID</Label>
            <Input id="org-id" value={organizationId} disabled readOnly className="min-w-0 break-all font-mono text-xs" />
            <p className="text-xs text-muted-foreground">Internal reference for support and billing.</p>
          </div>
          <div className="flex items-start gap-3 rounded-md border p-3">
            <input
              id="signatureClickTrackingEnabled"
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input disabled:opacity-50"
              checked={signatureClickTrackingEnabled}
              onChange={(e) => setSignatureClickTrackingEnabled(e.target.checked)}
              disabled={!canEdit}
            />
            <div className="space-y-1">
              <Label htmlFor="signatureClickTrackingEnabled" className="cursor-pointer font-normal leading-snug">
                Log signature link clicks (analytics)
              </Label>
              <p className="text-xs text-muted-foreground">
                On by default for new organizations. Uncheck to opt out. When enabled, links in rendered signatures use
                a signed redirect that records counts by link type (logo, website, email, phone, social). Signing uses
                the same app secret as authentication—no extra configuration.
              </p>
            </div>
          </div>
          {!canEdit ? (
            <p className="text-xs text-muted-foreground">Only owners and admins can change organization settings.</p>
          ) : null}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
          <Button type="submit" disabled={!canEdit}>
            Save
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
