import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="text-sm font-medium text-muted-foreground mb-4">Tailnote</p>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground mb-6">
        Professional email signatures for modern teams.
      </h1>
      <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
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
