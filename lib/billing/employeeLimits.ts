import mongoose from 'mongoose';
import { connectMongoose } from '@/lib/mongoose';
import { EmployeeModel } from '@/models/Employee';
import { OrganizationModel } from '@/models/Organization';
import { OrganizationSubscriptionModel } from '@/models/OrganizationSubscription';
import { SubscriptionPlanModel, type SubscriptionPlanDoc } from '@/models/SubscriptionPlan';

export type EmployeeLimitInfo = {
  currentCount: number;
  maxEmployees: number | null;
  canAddMore: boolean;
  canAddBeyondIncluded: boolean;
};

export class EmployeeLimitReachedError extends Error {
  readonly code = 'employee_limit_reached' as const;
  readonly maxEmployees: number;
  readonly currentCount: number;

  constructor(maxEmployees: number, currentCount: number) {
    super(
      `Your plan includes ${maxEmployees} user${maxEmployees === 1 ? '' : 's'}. Choose a plan with additional users to add more.`
    );
    this.name = 'EmployeeLimitReachedError';
    this.maxEmployees = maxEmployees;
    this.currentCount = currentCount;
  }
}

export function getEmployeeLimitForPlan(
  plan: Pick<SubscriptionPlanDoc, 'includedUsers' | 'additionalUserPriceCents'>
): Pick<EmployeeLimitInfo, 'maxEmployees' | 'canAddBeyondIncluded'> {
  if (plan.additionalUserPriceCents > 0) {
    return { maxEmployees: null, canAddBeyondIncluded: true };
  }
  return {
    maxEmployees: Math.max(1, plan.includedUsers ?? 1),
    canAddBeyondIncluded: false,
  };
}

export async function resolveOrganizationSubscriptionPlan(
  organizationId: string | mongoose.Types.ObjectId
): Promise<SubscriptionPlanDoc | null> {
  await connectMongoose();
  const orgId =
    typeof organizationId === 'string'
      ? new mongoose.Types.ObjectId(organizationId)
      : organizationId;

  const orgSub = await OrganizationSubscriptionModel.findOne({ organizationId: orgId })
    .populate('subscriptionPlanId')
    .lean<{ subscriptionPlanId: SubscriptionPlanDoc | null }>();

  if (orgSub?.subscriptionPlanId) {
    return orgSub.subscriptionPlanId;
  }

  const org = await OrganizationModel.findById(orgId).select('plan').lean<{ plan?: string }>();
  const slug = org?.plan;
  if (!slug || slug === 'none') return null;

  return SubscriptionPlanModel.findOne({
    slug,
    active: true,
    paused: false,
    archived: false,
  })
    .sort({ version: -1 })
    .lean<SubscriptionPlanDoc>();
}

export async function getEmployeeLimitsForOrganization(
  organizationId: string | mongoose.Types.ObjectId
): Promise<EmployeeLimitInfo> {
  await connectMongoose();
  const orgId =
    typeof organizationId === 'string'
      ? new mongoose.Types.ObjectId(organizationId)
      : organizationId;

  const currentCount = await EmployeeModel.countDocuments({ organizationId: orgId });

  if (!process.env.STRIPE_SECRET_KEY) {
    return {
      currentCount,
      maxEmployees: null,
      canAddMore: true,
      canAddBeyondIncluded: true,
    };
  }

  const plan = await resolveOrganizationSubscriptionPlan(orgId);
  if (!plan) {
    return {
      currentCount,
      maxEmployees: null,
      canAddMore: true,
      canAddBeyondIncluded: true,
    };
  }

  const { maxEmployees, canAddBeyondIncluded } = getEmployeeLimitForPlan(plan);
  const canAddMore =
    maxEmployees === null ? true : currentCount < maxEmployees;

  return {
    currentCount,
    maxEmployees,
    canAddMore,
    canAddBeyondIncluded,
  };
}

export async function assertCanAddEmployee(
  organizationId: string | mongoose.Types.ObjectId
): Promise<void> {
  const limits = await getEmployeeLimitsForOrganization(organizationId);
  if (limits.canAddMore) return;
  if (limits.maxEmployees === null) return;
  throw new EmployeeLimitReachedError(limits.maxEmployees, limits.currentCount);
}
