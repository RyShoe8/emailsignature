import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Pricing — Tailnote',
};

export default function PricingPage() {
  return (
    <div className="mx-auto min-w-0 max-w-5xl px-4 py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight sm:text-3xl">Pricing</h1>
      <p className="text-muted-foreground mb-10 max-w-xl">
        Simple yearly plans per organization. Seat-based billing comes later — today you choose Basic or Pro for
        the whole team.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic</CardTitle>
            <CardDescription>Core email signature features · up to 3 templates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">$10/yr</p>
            <p className="text-sm text-muted-foreground mt-1">Flat per org (configure exact price in Stripe)</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/signup">Start with Basic</Link>
            </Button>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pro</CardTitle>
            <CardDescription>Advanced layouts and promotional blocks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">$20/yr</p>
            <p className="text-sm text-muted-foreground mt-1">Flat per org (configure exact price in Stripe)</p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="accent" className="w-full">
              <Link href="/signup">Start with Pro</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
