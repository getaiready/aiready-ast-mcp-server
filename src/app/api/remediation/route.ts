import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  createRemediation,
  listRemediations,
  listTeamRemediations,
  RemediationRequest,
} from '@/lib/db';
import { randomUUID } from 'crypto';

// GET /api/remediation - List remediations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('repoId');
    const teamId = searchParams.get('teamId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    let remediations: RemediationRequest[];

    if (teamId) {
      remediations = await listTeamRemediations(teamId, limit);
    } else if (repoId) {
      remediations = await listRemediations(repoId, limit);
    } else {
      return NextResponse.json(
        { error: 'repoId or teamId is required' },
        { status: 400 }
      );
    }

    // Filter by status if provided
    if (status) {
      remediations = remediations.filter((r) => r.status === status);
    }

    return NextResponse.json({ remediations });
  } catch (error) {
    console.error('Error listing remediations:', error);
    return NextResponse.json(
      { error: 'Failed to list remediations' },
      { status: 500 }
    );
  }
}

// POST /api/remediation - Create a new remediation request
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      repoId,
      teamId,
      type,
      risk,
      title,
      description,
      affectedFiles,
      estimatedSavings,
    } = body;

    if (!repoId || !type || !risk || !title) {
      return NextResponse.json(
        {
          error: 'repoId, type, risk, and title are required',
        },
        { status: 400 }
      );
    }

    const validTypes = ['consolidation', 'rename', 'restructure', 'refactor'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid remediation type' },
        { status: 400 }
      );
    }

    const validRisks = ['low', 'medium', 'high', 'critical'];
    if (!validRisks.includes(risk)) {
      return NextResponse.json(
        { error: 'Invalid risk level' },
        { status: 400 }
      );
    }

    const remediation = await createRemediation({
      id: randomUUID(),
      repoId,
      teamId,
      userId: session.user.id,
      type,
      risk,
      title,
      description: description || '',
      status: 'pending',
      affectedFiles: affectedFiles || [],
      estimatedSavings: estimatedSavings || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ remediation }, { status: 201 });
  } catch (error) {
    console.error('Error creating remediation:', error);
    return NextResponse.json(
      { error: 'Failed to create remediation' },
      { status: 500 }
    );
  }
}
