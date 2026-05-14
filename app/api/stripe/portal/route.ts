import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { getStripe } from '@/lib/stripe/client';

export async function POST() {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as { organizationId?: string };
  if (!user.organizationId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }

  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org?.stripeCustomerId) {
    return NextResponse.json({ error: 'No Stripe customer yet' }, { status: 400 });
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${base}/dashboard/billing`,
  });

  return NextResponse.json({ url: portal.url });
}
