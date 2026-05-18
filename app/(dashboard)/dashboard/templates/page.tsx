'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Row = { _id: string; name: string; presetId: string; includeAnimationSlot?: boolean };

export default function TemplatesDashboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState('');
  const [presetId, setPresetId] = useState<'minimal' | 'modern' | 'corporate' | 'professional'>('minimal');
  const [includeAnimation, setIncludeAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch('/api/dashboard/templates')
      .then((r) => r.json())
      .then((d) => setRows(d.templates || []));
  };

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/dashboard/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, presetId, includeAnimationSlot: includeAnimation }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Could not create');
      return;
    }
    setName('');
    load();
  }

  async function removeRow(id: string) {
    const res = await fetch(`/api/dashboard/templates/${id}`, { method: 'DELETE' });
    if (res.ok) load();
  }

  return (
    <div className="max-w-3xl min-w-0 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <p className="text-muted-foreground text-sm mt-1">Presets map to controlled layouts — no raw HTML.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add template</CardTitle>
          <CardDescription>
            All four layouts are available on every plan. Pro plans can enable the animation slot for GIF logos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Preset</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                value={presetId}
                onChange={(e) => setPresetId(e.target.value as typeof presetId)}
              >
                <option value="minimal">Minimal</option>
                <option value="modern">Stacked</option>
                <option value="corporate">Corporate</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeAnimation} onChange={(e) => setIncludeAnimation(e.target.checked)} />
              Include animation slot (Pro)
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit">Create</Button>
          </form>
        </CardContent>
      </Card>
      <div className="border rounded-lg divide-y">
        {rows.map((r) => (
          <div
            key={r._id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="min-w-0">
              <p className="font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {r.presetId}
                {r.includeAnimationSlot ? ' · animation' : ''}
              </p>
            </div>
            <Button variant="outline" size="sm" type="button" className="shrink-0 self-start sm:self-auto" onClick={() => void removeRow(r._id)}>
              Delete
            </Button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        <Link href="/dashboard/signature" className="underline">
          Organization brand
        </Link>{' '}
        is edited separately.
      </p>
    </div>
  );
}
