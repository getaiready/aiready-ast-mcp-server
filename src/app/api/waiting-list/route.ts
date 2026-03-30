import { NextRequest, NextResponse } from 'next/server';
import { storeSubmissionAndNotify } from '@/lib/api/submissions';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { email, plan, notes } = data;

    if (!email || !plan) {
      return NextResponse.json(
        { error: 'Email and plan are required' },
        { status: 400 }
      );
    }

    const now = new Date();
    const payload = {
      email,
      plan,
      notes,
      receivedAt: now.toISOString(),
      source: 'platform-pricing',
    };

    const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #0891b2;">New Waitlist Signup</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Plan:</strong> ${plan}</p>
        <p><strong>Notes:</strong> ${notes || 'None'}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">Received at ${now.toLocaleString()}</p>
      </div>
    `;

    return await storeSubmissionAndNotify({
      keyPrefix: `waiting-list/${plan}`,
      payload,
      emailSubject: `⏳ New Waitlist: ${plan} (${email})`,
      emailHtmlBody: htmlBody,
      errorContext: 'Waiting list',
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Waiting list error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
