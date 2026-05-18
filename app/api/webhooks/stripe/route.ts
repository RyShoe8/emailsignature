import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

import { getStripe } from '@/lib/stripe/client';
import { connectMongoose } from '@/lib/mongoose';
import { OrganizationModel } from '@/models/Organization';
import { OrganizationSubscriptionModel } from '@/models/OrganizationSubscription';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { StripeWebhookEventModel } from '@/models/StripeWebhookEvent';
import { getEffectiveSeatCount } from '@/lib/billing/employeeLimits';
import { EmployeeModel } from '@/models/Employee';
import { isValidObjectIdString } from '@/lib/admin/data';
import { persistOrganizationSubscriptionStripeItems } from '@/lib/stripe/subscriptionItemSync';
import { syncStripeSubscriptionSeatsForOrganization } from '@/lib/stripe/syncSubscriptionSeats';

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

function mapOrgSubStatus(
  status: Stripe.Subscription.Status
): 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' {
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

async function resolveSubscriptionPlanMongoId(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<string | null> {
  const mid = session.metadata?.subscriptionPlanId;
  if (mid && isValidObjectIdString(mid)) return mid;
  if (session.mode === 'subscription' && session.subscription) {
    const sub = await stripe.subscriptions.retrieve(String(session.subscription), {
      expand: ['items.data.price'],
    });
    const priceId = sub.items.data[0]?.price?.id;
    if (!priceId) return null;
    const plan = await SubscriptionPlanModel.findOne({ stripeBasePriceId: priceId, active: true })
      .sort({ version: -1 })
      .select('_id')
      .lean();
    return plan ? String(plan._id) : null;
  }
  if (session.mode === 'payment') {
    const cs = await stripe.checkout.sessions.retrieve(session.id, { expand: ['line_items.data.price'] });
    const pid = cs.line_items?.data[0]?.price?.id;
    if (!pid) return null;
    const plan = await SubscriptionPlanModel.findOne({ stripeBasePriceId: pid, active: true })
      .sort({ version: -1 })
      .select('_id')
      .lean();
    return plan ? String(plan._id) : null;
  }
  return null;
}

function organizationPlanForStripeStatus(
  status: Stripe.Subscription.Status
): 'pro' | 'none' {
  if (status === 'active' || status === 'trialing' || status === 'past_due') return 'pro';
  return 'none';
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
        if (!orgId || !session.customer || !isValidObjectIdString(orgId)) break;

        const customerId = String(session.customer);
        const planDocId = await resolveSubscriptionPlanMongoId(stripe, session);

        if (session.mode === 'subscription' && session.subscription) {
          const subId = String(session.subscription);
          await OrganizationModel.findByIdAndUpdate(orgId, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subId,
            subscriptionStatus: 'active',
            plan: 'pro',
          });

          if (planDocId) {
            const orgObjId = new mongoose.Types.ObjectId(orgId);
            const planObjId = new mongoose.Types.ObjectId(planDocId);
            const plan = await SubscriptionPlanModel.findById(planObjId).lean();
            const sub = await stripe.subscriptions.retrieve(subId, { expand: ['items.data.price'] });
            const count = getEffectiveSeatCount(
              await EmployeeModel.countDocuments({ organizationId: orgObjId })
            );
            const renewsAt =
              typeof sub.current_period_end === 'number'
                ? new Date(sub.current_period_end * 1000)
                : undefined;

            await OrganizationSubscriptionModel.findOneAndUpdate(
              { organizationId: orgObjId },
              {
                $set: {
                  subscriptionPlanId: planObjId,
                  stripeCustomerId: customerId,
                  stripeSubscriptionId: subId,
                  status: 'active',
                  seats: count,
                  startedAt: new Date(),
                  renewsAt,
                },
              },
              { upsert: true }
            );
            if (plan) {
              await persistOrganizationSubscriptionStripeItems(orgObjId, sub, plan);
              await syncStripeSubscriptionSeatsForOrganization(orgObjId);
            }
          }
        } else if (session.mode === 'payment') {
          await OrganizationModel.findByIdAndUpdate(orgId, {
            stripeCustomerId: customerId,
            stripeSubscriptionId: '',
            subscriptionStatus: 'active',
            plan: 'pro',
          });
          if (planDocId) {
            const orgObjId = new mongoose.Types.ObjectId(orgId);
            const planObjId = new mongoose.Types.ObjectId(planDocId);
            const count = getEffectiveSeatCount(
              await EmployeeModel.countDocuments({ organizationId: orgObjId })
            );
            await OrganizationSubscriptionModel.findOneAndUpdate(
              { organizationId: orgObjId },
              {
                $set: {
                  subscriptionPlanId: planObjId,
                  stripeCustomerId: customerId,
                  stripeSubscriptionId: '',
                  status: 'active',
                  seats: count,
                  stripeBaseItemId: '',
                  stripeSeatItemId: '',
                  startedAt: new Date(),
                },
              },
              { upsert: true }
            );
          }
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const orgId = sub.metadata?.organizationId;
        const status =
          event.type === 'customer.subscription.deleted'
            ? 'canceled'
            : mapSubscriptionStatus(sub.status);

        const patch: Record<string, unknown> = {
          stripeSubscriptionId: sub.id,
          stripeCustomerId: String(sub.customer),
          subscriptionStatus: status,
          plan: organizationPlanForStripeStatus(sub.status),
        };

        if (orgId) {
          await OrganizationModel.findByIdAndUpdate(orgId, patch);
        } else if (sub.customer) {
          await OrganizationModel.findOneAndUpdate({ stripeCustomerId: String(sub.customer) }, patch);
        }

        const orgSubStatus =
          event.type === 'customer.subscription.deleted'
            ? 'canceled'
            : mapOrgSubStatus(sub.status);
        const orgSubPatch: Record<string, unknown> = {
          status: orgSubStatus,
          stripeCustomerId: String(sub.customer),
        };
        if (typeof sub.current_period_end === 'number') {
          orgSubPatch.renewsAt = new Date(sub.current_period_end * 1000);
        }

        const orgSub = await OrganizationSubscriptionModel.findOneAndUpdate(
          { stripeSubscriptionId: sub.id },
          { $set: orgSubPatch },
          { new: true }
        )
          .populate<{ subscriptionPlanId: SubscriptionPlanDoc | null }>('subscriptionPlanId')
          .lean();

        if (orgSub) {
          const planDoc = orgSub.subscriptionPlanId;
          const orgObjId = new mongoose.Types.ObjectId(String(orgSub.organizationId));
          if (planDoc && event.type !== 'customer.subscription.deleted') {
            await persistOrganizationSubscriptionStripeItems(orgObjId, sub, planDoc);
            await syncStripeSubscriptionSeatsForOrganization(orgObjId);
          }
        }
        break;
      }
      case 'invoice.paid': {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id;
        if (!customerId) break;
        await OrganizationModel.findOneAndUpdate(
          { stripeCustomerId: customerId },
          { subscriptionStatus: 'active' }
        );
        const subRef = inv.subscription;
        const subId = typeof subRef === 'string' ? subRef : subRef?.id;
        if (subId) {
          await OrganizationSubscriptionModel.findOneAndUpdate(
            { stripeSubscriptionId: subId },
            { $set: { status: 'active' } }
          );
        }
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = typeof inv.customer === 'string' ? inv.customer : inv.customer?.id;
        if (!customerId) break;
        await OrganizationModel.findOneAndUpdate(
          { stripeCustomerId: customerId },
          { subscriptionStatus: 'past_due' }
        );
        const subRef = inv.subscription;
        const subId = typeof subRef === 'string' ? subRef : subRef?.id;
        if (subId) {
          await OrganizationSubscriptionModel.findOneAndUpdate(
            { stripeSubscriptionId: subId },
            { $set: { status: 'past_due' } }
          );
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
