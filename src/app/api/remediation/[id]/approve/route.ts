import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRemediation, updateRemediation } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const remediation = await getRemediation(id);

    if (!remediation) {
      return NextResponse.json(
        { error: 'Remediation not found' },
        { status: 404 }
      );
    }

    // Only allow the remediation owner to approve
    if (remediation.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { assignedTo } = body;

    await updateRemediation(id, {
      status: 'approved',
      assignedTo: assignedTo || session.user.id,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, status: 'approved' });
  } catch (error) {
    console.error('Error approving remediation:', error);
    return NextResponse.json(
      { error: 'Failed to approve remediation' },
      { status: 500 }
    );
  }
}
