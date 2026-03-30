import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createCheckoutSession, createPortalSession } from '@/lib/billing';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, teamId, plan } = body;

    if (action === 'checkout') {
      if (!teamId || !plan) {
        return NextResponse.json(
          { error: 'Team ID and Plan are required' },
          { status: 400 }
        );
      }

      // In a real app, verify user is an admin of the team

      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host');
      const baseUrl = `${protocol}://${host}`;

      const checkoutSession = await createCheckoutSession(
        teamId,
        plan,
        session.user.email,
        `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        `${baseUrl}/dashboard`
      );

      return NextResponse.json({ url: checkoutSession.url });
    }

    if (action === 'portal') {
      const { customerId } = body;
      if (!customerId) {
        return NextResponse.json(
          { error: 'Customer ID is required' },
          { status: 400 }
        );
      }

      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host');
      const baseUrl = `${protocol}://${host}`;

      const portalSession = await createPortalSession(
        customerId,
        `${baseUrl}/dashboard`
      );

      return NextResponse.json({ url: portalSession.url });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Billing API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
