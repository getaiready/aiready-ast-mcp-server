/**
 * Plan-gating middleware for API routes
 *
 * Usage:
 *   import { withAuth } from '@/lib/middleware';
 *
 *   export const GET = withAuth(async (request, { user, team }) => {
 *     // Only runs if user is authenticated and team has required plan
 *     return NextResponse.json({ data: '...' });
 *   }, { requiredPlan: 'team' });
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth';
import { getTeam, getUser } from './db';
import {
  Plan,
  planHierarchy,
  planLimits,
  MVP_FREE_ONLY,
  COMING_SOON_MESSAGE,
} from './plans';

interface AuthContext {
  userId: string;
  email?: string;
  name?: string;
  teamId?: string;
  plan: Plan;
}

interface WithAuthOptions {
  requiredPlan?: Plan;
  requiredFeature?: keyof typeof planLimits.team.features;
}

/**
 * Check if a plan meets the minimum required level
 */
function meetsPlanRequirement(currentPlan: Plan, requiredPlan: Plan): boolean {
  return (
    (planHierarchy[currentPlan] || 0) >= (planHierarchy[requiredPlan] || 0)
  );
}

/**
 * Higher-order function to wrap API routes with authentication and plan checking
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: AuthContext
  ) => Promise<NextResponse>,
  options: WithAuthOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      // Check authentication
      const session = await auth();

      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      // Get user details
      const user = await getUser(session.user.id);

      if (!user) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Determine plan
      let plan: Plan = 'free';

      if (user.teamId) {
        const team = await getTeam(user.teamId);
        if (team) {
          plan = team.plan || 'free';
        }
      }

      // MVP Mode: All users get free tier, premium features show "coming soon"
      if (
        MVP_FREE_ONLY &&
        options.requiredPlan &&
        options.requiredPlan !== 'free'
      ) {
        return NextResponse.json(
          {
            error: COMING_SOON_MESSAGE,
            code: 'FEATURE_COMING_SOON',
            currentPlan: 'free',
            requiredPlan: options.requiredPlan,
          },
          { status: 200 } // Return 200 instead of 403 during MVP
        );
      }

      // Check plan requirement (only runs when MVP_FREE_ONLY is false)
      if (
        options.requiredPlan &&
        !meetsPlanRequirement(plan, options.requiredPlan)
      ) {
        const upgradePrompt = getUpgradeMessage(options.requiredPlan);
        return NextResponse.json(
          {
            error: `This feature requires a ${options.requiredPlan} plan`,
            code: 'PLAN_UPGRADE_REQUIRED',
            currentPlan: plan,
            requiredPlan: options.requiredPlan,
            upgradeUrl: upgradePrompt.url,
          },
          { status: 403 }
        );
      }

      // Check feature requirement
      if (options.requiredFeature) {
        const limits = planLimits[plan];
        const hasFeature = limits.features[options.requiredFeature];

        // MVP Mode: Premium features show "coming soon"
        if (MVP_FREE_ONLY && !hasFeature) {
          return NextResponse.json(
            {
              error: COMING_SOON_MESSAGE,
              code: 'FEATURE_COMING_SOON',
              currentPlan: 'free',
              requiredFeature: options.requiredFeature,
            },
            { status: 200 }
          );
        }

        if (!hasFeature) {
          return NextResponse.json(
            {
              error: `Your current plan does not include ${options.requiredFeature}`,
              code: 'FEATURE_NOT_AVAILABLE',
              currentPlan: plan,
              requiredFeature: options.requiredFeature,
            },
            { status: 403 }
          );
        }
      }

      // Build context
      const context: AuthContext = {
        userId: user.id,
        email: user.email,
        name: user.name || undefined,
        teamId: user.teamId || undefined,
        plan,
      };

      // Call the handler
      return handler(request, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'INTERNAL_ERROR' },
        { status: 500 }
      );
    }
  };
}

/**
 * Get upgrade message for a plan
 */
function getUpgradeMessage(requiredPlan: Plan): {
  url: string;
  message: string;
} {
  const urls: Record<Plan, string> = {
    free: '/pricing',
    pro: '/pricing#pro',
    team: '/pricing#team',
    enterprise: '/pricing#enterprise',
  };

  const messages: Record<Plan, string> = {
    free: 'Sign up for free',
    pro: 'Upgrade to Pro ($49/mo)',
    team: 'Upgrade to Team ($99/mo)',
    enterprise: 'Contact sales for Enterprise',
  };

  return {
    url: urls[requiredPlan] || urls.free,
    message: messages[requiredPlan] || 'Upgrade your plan',
  };
}

/**
 * Convenience function to check if user has a specific plan
 */
export async function checkPlan(
  userId: string,
  requiredPlan: Plan
): Promise<{ hasPlan: boolean; currentPlan: Plan }> {
  const user = await getUser(userId);

  if (!user) {
    return { hasPlan: false, currentPlan: 'free' };
  }

  let currentPlan: Plan = 'free';

  if (user.teamId) {
    const team = await getTeam(user.teamId);
    if (team) {
      currentPlan = team.plan || 'free';
    }
  }

  return {
    hasPlan: meetsPlanRequirement(currentPlan, requiredPlan),
    currentPlan,
  };
}

/**
 * Rate limiting by plan
 */
export function getRateLimit(plan: Plan): {
  maxRequests: number;
  windowMs: number;
} {
  // Different rate limits per plan
  const rateLimits: Record<Plan, { maxRequests: number; windowMs: number }> = {
    free: { maxRequests: 10, windowMs: 60000 }, // 10 req/min
    pro: { maxRequests: 100, windowMs: 60000 }, // 100 req/min
    team: { maxRequests: 500, windowMs: 60000 }, // 500 req/min
    enterprise: { maxRequests: 2000, windowMs: 60000 }, // 2000 req/min
  };

  return rateLimits[plan] || rateLimits.free;
}
