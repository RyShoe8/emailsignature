'use client';

import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

type SignOutButtonProps = {
  onSignedOut?: () => void;
};

export function SignOutButton({ onSignedOut }: SignOutButtonProps) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="ghost"
      className="w-full justify-start px-2"
      onClick={async () => {
        await authClient.signOut();
        onSignedOut?.();
        router.push('/');
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
