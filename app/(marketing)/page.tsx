import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="mx-auto min-w-0 max-w-3xl px-4 py-12 text-center sm:py-24">
      <p className="mb-4 text-sm font-medium text-muted-foreground">Tailnote</p>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
        Professional email signatures for modern teams.
      </h1>
      <p className="mx-auto mb-10 max-w-2xl text-base text-muted-foreground sm:text-lg">
        Create, manage, and deploy consistent company signatures in minutes.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/signup">Get started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/pricing">View pricing</Link>
        </Button>
      </div>
    </div>
  );
}
