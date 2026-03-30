import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createMagicLinkToken, getUserByEmail, createUser } from '@/lib/db';
import { sendMagicLinkEmail } from '@/lib/email';

const MAGIC_LINK_EXPIRY_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists, if not create a placeholder
    let user = await getUserByEmail(normalizedEmail);
    if (!user) {
      // Create user without password (will be set later or remain OAuth-only)
      const userId = randomUUID();
      user = await createUser({
        id: userId,
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Generate token
    const token = randomUUID();
    const expiresAt = new Date(
      Date.now() + MAGIC_LINK_EXPIRY_MINUTES * 60 * 1000
    ).toISOString();

    // Store token
    await createMagicLinkToken({
      token,
      email: normalizedEmail,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
    });

    // Send magic link email
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://dev.platform.getaiready.dev';
    const magicLinkUrl = `${baseUrl}/auth/verify?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    try {
      await sendMagicLinkEmail({
        to: normalizedEmail,
        magicLinkUrl,
      });
    } catch (emailError) {
      console.error('Failed to send magic link email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Magic link sent to ${normalizedEmail}`,
      expiresInMinutes: MAGIC_LINK_EXPIRY_MINUTES,
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
