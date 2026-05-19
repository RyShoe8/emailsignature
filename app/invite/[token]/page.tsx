'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type InviteInfo = {
  orgName: string;
  email: string;
  alreadyAccepted: boolean;
  expired: boolean;
  employeeFirstName?: string;
};

function InvitePageContent() {
  const params = useParams();
  const token = String(params.token);
  const searchParams = useSearchParams();
  const shouldAccept = searchParams.get('accept') === '1';

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvite = useCallback(async () => {
    const res = await fetch(`/api/invite/${encodeURIComponent(token)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(typeof data.error === 'string' ? data.error : 'Invitation not found');
      setInfo(null);
      return;
    }
    setInfo(data as InviteInfo);
    setError(null);
  }, [token]);

  const tryAccept = useCallback(async () => {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/invite/${encodeURIComponent(token)}/accept`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Could not accept invitation');
        return;
      }
      window.location.href = typeof data.redirect === 'string' ? data.redirect : '/dashboard/signature';
    } finally {
      setAccepting(false);
    }
  }, [token]);

  useEffect(() => {
    loadInvite().finally(() => setLoading(false));
  }, [loadInvite]);

  useEffect(() => {
    if (!shouldAccept || loading || !info || info.alreadyAccepted || info.expired) return;
    void tryAccept();
  }, [shouldAccept, loading, info, tryAccept]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <p className="text-sm text-muted-foreground">Loading invitation…</p>
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invitation unavailable</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/login">Go to login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!info) return null;

  const signupUrl = `/signup?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(info.email)}`;
  const loginUrl = `/login?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(info.email)}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img
            src="/images/tailnote-logo.png"
            alt="Tailnote"
            className="mx-auto mb-4 h-10 w-auto"
            width={140}
            height={40}
          />
          <CardTitle>
            {info.alreadyAccepted
              ? 'Invitation already accepted'
              : info.expired
                ? 'Invitation expired'
                : `Join ${info.orgName}`}
          </CardTitle>
          <CardDescription>
            {info.alreadyAccepted
              ? 'This invitation has already been used. Sign in to access your workspace.'
              : info.expired
                ? 'Ask your administrator to send a new invitation.'
                : `You've been invited to set up your email signature with ${info.orgName}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!info.alreadyAccepted && !info.expired ? (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Invitation sent to <span className="font-medium text-foreground">{info.email}</span>
              </p>
              {error ? <p className="text-sm text-destructive text-center">{error}</p> : null}
              <Button
                className="w-full"
                disabled={accepting}
                onClick={() => void tryAccept()}
              >
                {accepting ? 'Accepting…' : 'Accept invitation'}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                You need to sign in or create an account with the invited email first.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button asChild variant="secondary" className="flex-1">
                  <Link href={signupUrl}>Create account</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href={loginUrl}>Log in</Link>
                </Button>
              </div>
            </>
          ) : (
            <Button asChild className="w-full">
              <Link href="/login">Log in</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
          <p className="text-sm text-muted-foreground">Loading invitation…</p>
        </div>
      }
    >
      <InvitePageContent />
    </Suspense>
  );
}
