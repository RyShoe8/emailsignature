'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';

export type PlanRow = {
  _id: string;
  name: string;
  slug: string;
  interval: string;
  basePriceCents: number;
  additionalUserPriceCents: number;
  includedUsers: number;
  active: boolean;
  paused: boolean;
  version: number;
  stripeBasePriceId?: string;
  legacyPlanKey?: string;
};

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function AdminPlansTable({ initialPlans }: { initialPlans: PlanRow[] }) {
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch('/api/admin/plans', { credentials: 'include' });
    const j = await res.json();
    if (res.ok) setPlans(j.plans);
  }, []);

  async function sync(id: string) {
    setMsg(null);
    const res = await fetch(`/api/admin/plans/${id}/sync`, { method: 'POST', credentials: 'include' });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(typeof j.error === 'string' ? j.error : 'Sync failed');
      return;
    }
    setMsg('Synced to Stripe.');
    await reload();
    router.refresh();
  }

  async function clone(id: string) {
    setMsg(null);
    const res = await fetch(`/api/admin/plans/${id}/clone`, { method: 'POST', credentials: 'include' });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg(typeof j.error === 'string' ? j.error : 'Clone failed');
      return;
    }
    setMsg('Plan cloned. Edit the new version and sync.');
    await reload();
    router.refresh();
  }

  async function togglePause(id: string, paused: boolean) {
    setMsg(null);
    const res = await fetch(`/api/admin/plans/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paused: !paused }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setMsg(typeof j.error === 'string' ? j.error : 'Update failed');
      return;
    }
    await reload();
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[48rem] text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Interval</th>
              <th className="p-3 font-medium">Base</th>
              <th className="p-3 font-medium">Seat</th>
              <th className="p-3 font-medium">Active</th>
              <th className="p-3 font-medium">Paused</th>
              <th className="p-3 font-medium">Ver</th>
              <th className="p-3 font-medium">Stripe</th>
              <th className="p-3 font-medium w-56">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p._id} className="border-b last:border-0">
                <td className="p-3 font-medium">
                  {p.name}
                  <span className="block text-xs text-muted-foreground">
                    {p.slug} {p.legacyPlanKey ? `· ${p.legacyPlanKey}` : ''}
                  </span>
                </td>
                <td className="p-3">{p.interval}</td>
                <td className="p-3">{fmtMoney(p.basePriceCents)}</td>
                <td className="p-3">{fmtMoney(p.additionalUserPriceCents)}</td>
                <td className="p-3">{p.active ? 'Yes' : 'No'}</td>
                <td className="p-3">{p.paused ? 'Yes' : 'No'}</td>
                <td className="p-3">{p.version}</td>
                <td className="p-3">{p.stripeBasePriceId ? 'Yes' : 'No'}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" size="sm" variant="secondary" onClick={() => void sync(p._id)}>
                      Sync
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void clone(p._id)}>
                      Clone
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void togglePause(p._id, p.paused)}>
                      {p.paused ? 'Unpause' : 'Pause'}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" asChild>
                      <Link href={`/admin/plans/${p._id}/edit`}>Edit</Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
