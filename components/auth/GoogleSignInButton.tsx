'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth/client';
import { Button } from '@/components/ui/button';

type Props = {
  callbackURL: string;
  label?: string;
};

export function GoogleSignInButton({ callbackURL, label = 'Continue with Google' }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onGoogle() {
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await authClient.signIn.social({
        provider: 'google',
        callbackURL,
      });
      if (err) {
        setError(err.message || 'Google sign-in failed');
        setLoading(false);
      }
    } catch {
      setError('Google sign-in failed');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={loading}
        onClick={() => void onGoogle()}
      >
        {loading ? 'Redirecting…' : label}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
