import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRuleset, updateRuleset } from '@/lib/db/rulesets';
import { getTeam } from '@/lib/db/teams';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await params;
    const ruleset = await getRuleset(teamId);

    return NextResponse.json({ ruleset });
  } catch (error) {
    console.error('[RulesetAPI] GET Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: teamId } = await params;
    const team = await getTeam(teamId);
    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const body = await req.json();
    await updateRuleset(teamId, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[RulesetAPI] POST Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
