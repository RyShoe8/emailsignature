import Link from 'next/link';
import { TailnoteLogo } from '@/components/brand/TailnoteLogo';
import { SiteHeaderNav } from '@/components/marketing/SiteHeaderNav';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex min-w-0 max-w-5xl items-center justify-between gap-3 overflow-visible px-4 py-1">
        <Link
          href="/"
          className="-my-6 flex min-w-0 max-w-[min(100%,14rem)] shrink-0 items-center leading-none rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:max-w-none sm:-my-10 md:-my-11 lg:-my-12"
        >
          <TailnoteLogo heightClass="h-20 sm:h-28 md:h-32 lg:h-36" priority />
        </Link>
        <div className="flex shrink-0 items-center gap-2">
          <SiteHeaderNav />
        </div>
      </div>
    </header>
  );
}
