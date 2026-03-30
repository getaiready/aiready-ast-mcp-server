import { NextRequest, NextResponse } from 'next/server';
import {
  getMagicLinkToken,
  markMagicLinkUsed,
  getUserByEmail,
  updateUser,
} from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Get token from database
    const magicLink = await getMagicLinkToken(token);

    if (!magicLink) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (magicLink.used) {
      return NextResponse.json(
        { error: 'Token already used' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(magicLink.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 });
    }

    // Mark token as used
    await markMagicLinkUsed(token);

    // Get user
    const user = await getUserByEmail(magicLink.email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    // Update email verified if not already
    if (!user.emailVerified) {
      await updateUser(user.id, { emailVerified: new Date().toISOString() });
    }

    // Return success with user info - client will use NextAuth to create session
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
