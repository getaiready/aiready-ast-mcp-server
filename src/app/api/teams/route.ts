import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listTeamMembers, addTeamMember, getUserByEmail } from '@/lib/db';

// GET /api/teams/members?teamId=<id> - List team members
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      // List user's teams
      const { listUserTeams } = await import('@/lib/db');
      const teams = await listUserTeams(session.user.id);
      return NextResponse.json({ teams });
    }

    // List team members
    const members = await listTeamMembers(teamId);
    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error listing members:', error);
    return NextResponse.json(
      { error: 'Failed to list members' },
      { status: 500 }
    );
  }
}

// POST /api/teams/invite - Invite a member to a team
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, email, role = 'member' } = body;

    if (!teamId || !email) {
      return NextResponse.json(
        { error: 'Team ID and Email are required' },
        { status: 400 }
      );
    }

    // 1. Get user by email
    const userToInvite = await getUserByEmail(email);
    if (!userToInvite) {
      return NextResponse.json(
        { error: 'User not found. They must sign in to AIReady first.' },
        { status: 404 }
      );
    }

    // 2. Add member
    await addTeamMember(teamId, userToInvite.id, role);

    return NextResponse.json({ success: true, user: userToInvite });
  } catch (error) {
    console.error('Error inviting member:', error);
    return NextResponse.json(
      { error: 'Failed to invite member' },
      { status: 500 }
    );
  }
}
