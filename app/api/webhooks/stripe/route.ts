import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';
import { getStripe } from '@/lib/stripe/client';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { StripeWebhookEventModel } from '@/models/StripeWebhookEvent';
import { stripePriceIds } from '@/lib/stripe/config';

function planFromPriceId(priceId: string | undefined): 'basic' | 'pro' | 'none' {
  if (!priceId) return 'none';
  if (priceId === stripePriceIds.basic) return 'basic';
  if (priceId === stripePriceIds.pro) return 'pro';
  return 'none';
}

function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): 'none' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'canceled';
    default:
      return 'incomplete';
  }
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  await connectMongoose();

  const existing = await StripeWebhookEventModel.findOne({ eventId: event.id });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.organizationId;
        if (orgId && session.subscription && session.customer) {
          const plan = session.metadata?.plan === 'pro' ? 'pro' : 'basic';
          await OrganizationModel.findByIdAndUpdate(orgId, {
            stripeCustomerId: String(session.customer),
            stripeSubscriptionId: String(session.subscription),
            subscriptionStatus: 'active',
            plan,
          });
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.organizationId;
        const priceId = sub.items.data[0]?.price?.id;
        const plan = planFromPriceId(priceId);
        const status =
          event.type === 'customer.subscription.deleted'
            ? 'canceled'
            : mapSubscriptionStatus(sub.status);

        const patch: Record<string, unknown> = {
          stripeSubscriptionId: sub.id,
          stripeCustomerId: String(sub.customer),
          subscriptionStatus: status,
        };
        if (plan !== 'none') {
          patch.plan = plan;
        }

        if (orgId) {
          await OrganizationModel.findByIdAndUpdate(orgId, patch);
        } else if (sub.customer) {
          await OrganizationModel.findOneAndUpdate({ stripeCustomerId: String(sub.customer) }, patch);
        }
        break;
      }
      default:
        break;
    }

    await StripeWebhookEventModel.create({ eventId: event.id });
  } catch (e) {
    console.error('[stripe webhook]', e);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
