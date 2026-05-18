'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';

export type CatalogPresetRow = {
  presetId: string;
  name: string;
  description: string;
  enabled: boolean;
  deletedAt: string | null;
  sortOrder: number;
  employeeCount: number;
  orgTemplateCount: number;
};

export function AdminTemplatesTable({ initialPresets }: { initialPresets: CatalogPresetRow[] }) {
  const router = useRouter();
  const [presets, setPresets] = useState(initialPresets);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch('/api/admin/templates', { credentials: 'include' });
    const j = await res.json();
    if (res.ok) setPresets(j.presets);
  }, []);

  async function toggleEnabled(p: CatalogPresetRow) {
    setMsg(null);
    const res = await fetch(`/api/admin/templates/${p.presetId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !p.enabled }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(typeof j.error === 'string' ? j.error : 'Update failed');
      return;
    }
    await reload();
    router.refresh();
  }

  async function softDelete(p: CatalogPresetRow) {
    if (!confirm(`Delete "${p.name}" globally? It will be hidden from all organizations.`)) return;
    setMsg(null);
    const res = await fetch(`/api/admin/templates/${p.presetId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(typeof j.error === 'string' ? j.error : 'Delete failed');
      return;
    }
    await reload();
    router.refresh();
  }

  async function restore(p: CatalogPresetRow) {
    setMsg(null);
    const res = await fetch(`/api/admin/templates/${p.presetId}`, {
      method: 'POST',
      credentials: 'include',
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(typeof j.error === 'string' ? j.error : 'Restore failed');
      return;
    }
    await reload();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="overflow-x-auto rounded-md border min-w-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-3 font-medium">Preset</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Usage</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {presets.map((p) => (
              <tr key={p.presetId} className="border-b last:border-0">
                <td className="p-3 align-top">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.presetId}</p>
                  <p className="mt-1 text-xs text-muted-foreground max-w-md">{p.description}</p>
                </td>
                <td className="p-3 align-top">
                  {p.deletedAt ? (
                    <span className="text-xs text-muted-foreground">Deleted</span>
                  ) : p.enabled ? (
                    <span className="text-xs text-foreground">Enabled</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Disabled</span>
                  )}
                </td>
                <td className="p-3 align-top text-xs text-muted-foreground">
                  {p.employeeCount} employee{p.employeeCount === 1 ? '' : 's'}
                  <br />
                  {p.orgTemplateCount} org row{p.orgTemplateCount === 1 ? '' : 's'}
                </td>
                <td className="p-3 align-top">
                  <div className="flex flex-wrap gap-2">
                    {p.deletedAt ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => void restore(p)}>
                        Restore
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void toggleEnabled(p)}
                        >
                          {p.enabled ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void softDelete(p)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
