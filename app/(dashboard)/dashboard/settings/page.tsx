'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [website, setWebsite] = useState('');
  const [signatureClickTrackingEnabled, setSignatureClickTrackingEnabled] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/organization')
      .then((r) => r.json())
      .then((d) => {
        if (d.organization) {
          const o = d.organization as {
            name?: string;
            _id?: string;
            website?: string;
            signatureClickTrackingEnabled?: boolean;
          };
          setName(String(o.name || ''));
          setOrgId(String(o._id || ''));
          setWebsite(String(o.website || ''));
          setSignatureClickTrackingEnabled(Boolean(o.signatureClickTrackingEnabled));
        }
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch('/api/dashboard/organization', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, website, signatureClickTrackingEnabled }),
    });
    if (res.ok) setMessage('Saved');
    else {
      const j = await res.json().catch(() => ({}));
      setMessage(typeof j.error === 'string' ? j.error : 'Could not save');
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Organization profile and public brand fields.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Slug is read-only in MVP.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Organization ID</Label>
              <Input value={orgId} disabled className="font-mono text-xs" />
              <p className="text-xs text-muted-foreground">Internal reference for support and billing.</p>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div className="flex items-start gap-3 rounded-md border p-3">
              <input
                id="signatureClickTrackingEnabled"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-input"
                checked={signatureClickTrackingEnabled}
                onChange={(e) => setSignatureClickTrackingEnabled(e.target.checked)}
              />
              <div className="space-y-1">
                <Label htmlFor="signatureClickTrackingEnabled" className="cursor-pointer font-normal leading-snug">
                  Log signature link clicks (analytics)
                </Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, links in rendered signatures go through a signed redirect that records click counts by
                  link type (logo, website, email, phone, social). Requires{' '}
                  <code className="text-[11px]">SIGNATURE_TRACKING_SECRET</code> or auth secret in production.
                </p>
              </div>
            </div>
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
