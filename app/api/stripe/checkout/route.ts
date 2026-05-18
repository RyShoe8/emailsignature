import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from '@/lib/auth/session';
import { connectMongoose } from '@/lib/mongoose';
import { getEffectiveSeatCount } from '@/lib/billing/employeeLimits';
import { OrganizationModel } from '@/models/Organization';
import { EmployeeModel } from '@/models/Employee';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';
import { getStripe } from '@/lib/stripe/client';
import { stripePriceIds } from '@/lib/stripe/config';
import { isValidObjectIdString } from '@/lib/admin/data';
import {
  assertPlanHasSubscriptionSlot,
  isPlanOfferable,
  PlanSubscriptionCapError,
} from '@/lib/billing/planSubscriptionCap';

const BodySchema = z
  .object({
    plan: z.enum(['basic', 'pro']).optional(),
    subscriptionPlanId: z.string().optional(),
  })
  .refine((b) => b.plan !== undefined || Boolean(b.subscriptionPlanId?.trim()), {
    message: 'Provide plan (basic|pro) or subscriptionPlanId',
  });

async function validatePlanForCheckout(
  dbPlan: SubscriptionPlanDoc,
  organizationId: string
): Promise<NextResponse | null> {
  if (!isPlanOfferable(dbPlan)) {
    return NextResponse.json({ error: 'Plan not available' }, { status: 400 });
  }
  if (!dbPlan.stripeBasePriceId) {
    return NextResponse.json({ error: 'Plan not synced to Stripe yet' }, { status: 400 });
  }
  try {
    await assertPlanHasSubscriptionSlot(dbPlan, organizationId);
  } catch (e) {
    if (e instanceof PlanSubscriptionCapError) {
      return NextResponse.json({ error: e.message }, { status: 409 });
    }
    throw e;
  }
  return null;
}

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

  await connectMongoose();
  const org = await OrganizationModel.findById(user.organizationId);
  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const base =
    process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';

  let priceId = '';
  let checkoutMode: 'subscription' | 'payment' = 'subscription';
  let subscriptionPlanIdMeta = '';
  let dbPlanForSeats: SubscriptionPlanDoc | null = null;

  if (parsed.data.subscriptionPlanId?.trim()) {
    const pid = parsed.data.subscriptionPlanId.trim();
    if (!isValidObjectIdString(pid)) {
      return NextResponse.json({ error: 'Invalid subscriptionPlanId' }, { status: 400 });
    }
    const dbPlan = await SubscriptionPlanModel.findById(pid).lean<SubscriptionPlanDoc>();
    if (!dbPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    const capErr = await validatePlanForCheckout(dbPlan, org._id.toString());
    if (capErr) return capErr;

    priceId = dbPlan.stripeBasePriceId;
    subscriptionPlanIdMeta = String(dbPlan._id);
    checkoutMode = dbPlan.interval === 'lifetime' ? 'payment' : 'subscription';
    dbPlanForSeats = dbPlan;
  } else if (parsed.data.plan) {
    const slugPlan = await SubscriptionPlanModel.findOne({
      slug: parsed.data.plan,
      active: true,
      paused: false,
      archived: false,
      stripeBasePriceId: { $exists: true, $nin: ['', null] },
    })
      .sort({ version: -1 })
      .lean<SubscriptionPlanDoc>();

    if (slugPlan?.stripeBasePriceId) {
      const capErr = await validatePlanForCheckout(slugPlan, org._id.toString());
      if (capErr) return capErr;

      priceId = slugPlan.stripeBasePriceId;
      subscriptionPlanIdMeta = String(slugPlan._id);
      checkoutMode = slugPlan.interval === 'lifetime' ? 'payment' : 'subscription';
      dbPlanForSeats = slugPlan;
    } else {
      priceId = parsed.data.plan === 'pro' ? stripePriceIds.pro : stripePriceIds.basic;
      if (!priceId) {
        return NextResponse.json({ error: 'Missing STRIPE_BASIC_PRICE_ID or STRIPE_PRO_PRICE_ID' }, { status: 500 });
      }
    }
  }

  const stripe = getStripe();
  const meta: Record<string, string> = {
    organizationId: org._id.toString(),
  };
  if (subscriptionPlanIdMeta) meta.subscriptionPlanId = subscriptionPlanIdMeta;

  const lineItems: import('stripe').Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: priceId, quantity: 1 },
  ];
  if (
    checkoutMode === 'subscription' &&
    dbPlanForSeats?.stripeSeatPriceId &&
    dbPlanForSeats.additionalUserPriceCents > 0
  ) {
    const cnt = getEffectiveSeatCount(
      await EmployeeModel.countDocuments({ organizationId: org._id })
    );
    const extra = Math.max(0, cnt - (dbPlanForSeats.includedUsers ?? 1));
    if (extra > 0) {
      lineItems.push({ price: dbPlanForSeats.stripeSeatPriceId, quantity: extra });
    }
  }

  const params: import('stripe').Stripe.Checkout.SessionCreateParams = {
    mode: checkoutMode,
    line_items: lineItems,
    success_url: `${base}/dashboard/billing?checkout=success`,
    cancel_url: `${base}/dashboard/billing`,
    metadata: meta,
  };

  if (checkoutMode === 'subscription') {
    params.subscription_data = {
      metadata: meta,
    };
  }

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
