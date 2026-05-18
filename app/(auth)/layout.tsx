import { ReactNode } from 'react';
import { SiteFooter } from '@/components/marketing/SiteFooter';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="flex flex-1 items-center justify-center px-3 py-10 sm:px-4 sm:py-12">
        <div className="w-full min-w-0 max-w-sm">{children}</div>
      </div>
      <SiteFooter variant="compact" />
    </div>
  );
}
