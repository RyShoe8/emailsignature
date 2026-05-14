import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { getStripe } from '@/lib/stripe/client';
import { stripePriceIds } from '@/lib/stripe/config';

const BodySchema = z.object({
  plan: z.enum(['basic', 'pro']),
});

export async function POST(request: Request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = session.user as { id: string; email?: string; organizationId?: string };
  if (!user.organizationId) {
    return NextResponse.json({ error: 'Create an organization first' }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const priceId = parsed.data.plan === 'pro' ? stripePriceIds.pro : stripePriceIds.basic;
  if (!priceId) {
    return NextResponse.json({ error: 'Missing STRIPE_BASIC_PRICE_ID or STRIPE_PRO_PRICE_ID' }, { status: 500 });
  }

  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';

  const stripe = getStripe();
  const params: import('stripe').Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/dashboard/billing?checkout=success`,
    cancel_url: `${base}/dashboard/billing`,
    metadata: {
      organizationId: org._id.toString(),
      plan: parsed.data.plan,
    },
    subscription_data: {
      metadata: {
        organizationId: org._id.toString(),
        plan: parsed.data.plan,
      },
    },
  };

  if (org.stripeCustomerId) {
    params.customer = org.stripeCustomerId;
  } else if (user.email) {
    params.customer_email = user.email;
  }

  const checkout = await stripe.checkout.sessions.create(params);
  if (!checkout.url) {
    return NextResponse.json({ error: 'No checkout URL' }, { status: 500 });
  }
  return NextResponse.json({ url: checkout.url });
}
