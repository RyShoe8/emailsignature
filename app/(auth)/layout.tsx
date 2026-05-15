import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-3 py-10 sm:px-4 sm:py-12">
      <div className="w-full min-w-0 max-w-sm">{children}</div>
    </div>
  );
}
