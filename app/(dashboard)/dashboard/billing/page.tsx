'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function BillingPage() {
  const [org, setOrg] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    fetch('/api/dashboard/organization')
      .then((r) => r.json())
      .then((d) => setOrg(d.organization));
  }, []);

  async function checkout(plan: 'basic' | 'pro') {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.url) window.location.href = data.url as string;
  }

  async function portal() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (data.url) window.location.href = data.url as string;
  }

  return (
    <div className="max-w-xl min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-sm mt-1">Flat organization subscription. Change prices in Stripe.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>Plan and subscription state from Stripe webhooks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Plan:</span> {String(org?.plan ?? '—')}
          </p>
          <p>
            <span className="text-muted-foreground">Subscription:</span>{' '}
            {String(org?.subscriptionStatus ?? '—')}
          </p>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => void checkout('basic')}>
          Checkout Basic
        </Button>
        <Button type="button" onClick={() => void checkout('pro')}>
          Checkout Pro
        </Button>
        <Button type="button" variant="outline" onClick={() => void portal()}>
          Customer portal
        </Button>
      </div>
    </div>
  );
}
