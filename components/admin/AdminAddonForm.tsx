'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Interval = 'month' | 'year' | 'one_time';

const empty = {
  name: '',
  slug: '',
  interval: 'month' as Interval,
  priceCents: 500,
  description: '',
};

export function AdminAddonForm({
  mode,
  addonId,
  initial,
}: {
  mode: 'create' | 'edit';
  addonId?: string;
  initial?: typeof empty;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial ?? empty);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        interval: form.interval,
        priceCents: Number(form.priceCents),
        description: form.description,
      };
      const url = mode === 'create' ? '/api/admin/addons' : `/api/admin/addons/${addonId}`;
      const res = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof j.error === 'string' ? j.error : typeof j.error === 'object' ? JSON.stringify(j.error) : 'Save failed');
        return;
      }
      router.push('/admin/addons');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create add-on' : 'Edit add-on'}</CardTitle>
        <CardDescription>Amounts are in USD cents. Sync to Stripe after saving.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))}
              required
              disabled={mode === 'edit'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="interval">Interval</Label>
            <select
              id="interval"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.interval}
              onChange={(e) => setForm((f) => ({ ...f, interval: e.target.value as Interval }))}
            >
              <option value="month">month</option>
              <option value="year">year</option>
              <option value="one_time">one_time</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priceCents">Price (cents)</Label>
            <Input
              id="priceCents"
              type="number"
              min={0}
              value={form.priceCents}
              onChange={(e) => setForm((f) => ({ ...f, priceCents: Number(e.target.value) }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/addons">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
