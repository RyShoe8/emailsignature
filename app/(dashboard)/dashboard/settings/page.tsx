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
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/organization')
      .then((r) => r.json())
      .then((d) => {
        if (d.organization) {
          setName(String(d.organization.name || ''));
          setOrgId(String(d.organization._id || ''));
          setWebsite(String(d.organization.website || ''));
        }
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch('/api/dashboard/organization', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, website }),
    });
    if (res.ok) setMessage('Saved');
    else setMessage('Could not save');
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
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
