'use client';

import { useMemo, useState } from 'react';
import type { AdminOrgPlanContext, AdminUserRow } from '@/lib/admin/data';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const NONE_PLAN_VALUE = '';

type Props = {
  organizationId: string;
  organizationName: string;
  planContext: AdminOrgPlanContext;
  initialUsers: AdminUserRow[];
};

export function AdminOrgUsersPanel({
  organizationId,
  organizationName,
  planContext,
  initialUsers,
}: Props) {
  const [subscriptionPlanId, setSubscriptionPlanId] = useState(
    planContext.initialSubscriptionPlanId || NONE_PLAN_VALUE
  );
  const [orgMessage, setOrgMessage] = useState<string | null>(null);
  const [orgSaving, setOrgSaving] = useState(false);

  const [rows, setRows] = useState(() =>
    initialUsers.map((u) => ({
      ...u,
      draftRole: u.role || 'member',
      draftPlatformAdmin: u.platformAdmin,
    }))
  );

  const planDirty = useMemo(
    () => subscriptionPlanId !== (planContext.initialSubscriptionPlanId || NONE_PLAN_VALUE),
    [subscriptionPlanId, planContext.initialSubscriptionPlanId]
  );

  const legacyMismatch =
    planContext.pinnedPlanLabel &&
    planContext.legacyPlanSlug !== 'none' &&
    !planContext.pinnedPlanLabel.toLowerCase().includes(planContext.legacyPlanSlug);

  async function savePlan() {
    setOrgSaving(true);
    setOrgMessage(null);
    try {
      const res = await fetch(`/api/admin/organizations/${organizationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionPlanId: subscriptionPlanId || null,
        }),
        credentials: 'include',
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrgMessage(typeof j.error === 'string' ? j.error : 'Save failed');
        return;
      }
      setOrgMessage(
        'Subscription plan saved in Tailnote. Stripe billing may still need a separate change if this org has an active Stripe subscription.'
      );
    } finally {
      setOrgSaving(false);
    }
  }

  async function saveUser(userId: string, role: string, platformAdmin: boolean) {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, platformAdmin }),
      credentials: 'include',
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      return typeof j.error === 'string' ? j.error : 'Save failed';
    }
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{organizationName}</h2>
        <p className="mt-1 break-all text-xs text-muted-foreground font-mono">{organizationId}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription plan</CardTitle>
          <CardDescription>
            Assigns a built plan from Plans (pinned by document id). Updates organization limits and
            legacy org.plan slug. Stripe may still need a separate change.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-lg">
          {planContext.pinnedPlanLabel ? (
            <p className="text-sm text-muted-foreground">
              Currently pinned: <span className="font-medium text-foreground">{planContext.pinnedPlanLabel}</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No subscription plan pinned.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Legacy org.plan slug: <span className="font-mono">{planContext.legacyPlanSlug}</span>
            {' · '}
            Subscription status: <span className="font-mono">{planContext.subscriptionStatus}</span>
          </p>
          {legacyMismatch ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Legacy slug and pinned plan may be out of sync. Saving will align org.plan with the selected
              plan.
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="org-plan">Plan</Label>
            <select
              id="org-plan"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              value={subscriptionPlanId}
              onChange={(e) => setSubscriptionPlanId(e.target.value)}
            >
              <option value={NONE_PLAN_VALUE}>None</option>
              {planContext.assignablePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          {planContext.assignablePlans.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No assignable plans. Create one under Admin → Plans.
            </p>
          ) : null}
          {orgMessage ? <p className="text-sm text-muted-foreground">{orgMessage}</p> : null}
          <Button type="button" disabled={!planDirty || orgSaving} onClick={() => void savePlan()}>
            {orgSaving ? 'Saving…' : 'Save plan'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Org role (owner / admin / member) and platform admin flag.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users linked to this organization.</p>
          ) : (
            rows.map((row) => (
              <UserRow
                key={row.id}
                row={row}
                onPatch={saveUser}
                onRowUpdate={(next) => {
                  setRows((prev) => prev.map((r) => (r.id === row.id ? next : r)));
                }}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type RowState = AdminUserRow & { draftRole: string; draftPlatformAdmin: boolean };

function UserRow({
  row,
  onPatch,
  onRowUpdate,
}: {
  row: RowState;
  onPatch: (userId: string, role: string, platformAdmin: boolean) => Promise<string | null>;
  onRowUpdate: (row: RowState) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const dirty =
    row.draftRole !== (row.role || 'member') || row.draftPlatformAdmin !== row.platformAdmin;

  async function save() {
    setSaving(true);
    setMsg(null);
    const err = await onPatch(row.id, row.draftRole, row.draftPlatformAdmin);
    if (err) {
      setMsg(err);
    } else {
      onRowUpdate({
        ...row,
        role: row.draftRole,
        platformAdmin: row.draftPlatformAdmin,
      });
      setMsg('Saved');
    }
    setSaving(false);
  }

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <p className="font-medium">{row.email}</p>
          {row.name ? <p className="text-sm text-muted-foreground">{row.name}</p> : null}
          <p className="mt-1 break-all text-xs text-muted-foreground font-mono">{row.id}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
        <div className="space-y-2">
          <Label htmlFor={`role-${row.id}`}>Org role</Label>
          <select
            id={`role-${row.id}`}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            value={row.draftRole}
            onChange={(e) => onRowUpdate({ ...row, draftRole: e.target.value })}
          >
            <option value="owner">owner</option>
            <option value="admin">admin</option>
            <option value="member">member</option>
          </select>
        </div>
        <div className="flex items-end gap-2 pb-1">
          <input
            id={`pa-${row.id}`}
            type="checkbox"
            className="h-4 w-4 rounded border-input"
            checked={row.draftPlatformAdmin}
            onChange={(e) => onRowUpdate({ ...row, draftPlatformAdmin: e.target.checked })}
          />
          <Label htmlFor={`pa-${row.id}`} className="font-normal cursor-pointer">
            Platform admin
          </Label>
        </div>
      </div>
      {msg ? <p className="text-xs text-muted-foreground">{msg}</p> : null}
      <Button type="button" size="sm" disabled={!dirty || saving} onClick={() => void save()}>
        {saving ? 'Saving…' : 'Save user'}
      </Button>
    </div>
  );
}
