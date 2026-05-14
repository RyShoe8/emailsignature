import Link from 'next/link';
import { SiteHeader } from '@/components/marketing/SiteHeader';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>
          © {new Date().getFullYear()} Tailnote.{' '}
          <Link href="/login" className="underline underline-offset-4">
            Log in
          </Link>
        </p>
      </footer>
    </div>
  );
}
