import Link from 'next/link';
import { TailnoteLogo } from '@/components/brand/TailnoteLogo';
import { Button } from '@/components/ui/button';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm">
          <TailnoteLogo heightClass="h-12" priority />
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
