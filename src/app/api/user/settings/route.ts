import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateUser } from '@/lib/db/users';

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { scanConfig } = await request.json();

    await updateUser(session.user.id, { scanConfig });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
