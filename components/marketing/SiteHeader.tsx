import Link from 'next/link';
import { TailnoteLogo } from '@/components/brand/TailnoteLogo';
import { Button } from '@/components/ui/button';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50 overflow-visible">
      <div className="mx-auto flex items-center justify-between gap-4 px-4 py-1 max-w-5xl overflow-visible">
        <Link
          href="/"
          className="flex shrink-0 items-center leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm -my-10 sm:-my-11 md:-my-12"
        >
          <TailnoteLogo heightClass="h-28 sm:h-32 md:h-36" priority />
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/pricing" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/templates" className="hover:text-foreground transition-colors">
            Templates
          </Link>
          <Link href="/login" className="hover:text-foreground transition-colors">
            Log in
          </Link>
          <Button asChild size="sm">
            <Link href="/signup">Sign up</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
