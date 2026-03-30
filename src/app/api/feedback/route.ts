import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { storeSubmissionAndNotify } from '@/lib/api/submissions';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const data = await req.json();
    const { message, email: optionalEmail } = data;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const email = session?.user?.email || optionalEmail || 'Anonymous';
    const now = new Date();

    const payload = {
      email,
      message,
      receivedAt: now.toISOString(),
      userAgent: req.headers.get('user-agent'),
      path: req.headers.get('referer'),
    };

    const htmlBody = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #4f46e5;">New User Feedback</h2>
        <p><strong>From:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-style: italic;">
          ${message.replace(/\n/g, '<br/>')}
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #666;">Received at ${now.toLocaleString()}</p>
      </div>
    `;

    return await storeSubmissionAndNotify({
      keyPrefix: 'feedback',
      payload,
      emailSubject: `📣 Feedback from ${email}`,
      emailHtmlBody: htmlBody,
      errorContext: 'Feedback',
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Feedback error:', error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
