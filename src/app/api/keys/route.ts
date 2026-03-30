import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  badRequest,
  errorResponse,
  parseBody,
  getRequiredQueryParam,
} from '@/lib/api-utils';
import { createApiKey, listUserApiKeys, deleteApiKey } from '@/lib/db';

// GET /api/keys - List user's API keys
export async function GET() {
  try {
    const userId = await requireAuth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const keys = await listUserApiKeys(userId);
    return NextResponse.json({ keys });
  } catch (error) {
    console.error('Error listing API keys:', error);
    return errorResponse('Failed to list API keys');
  }
}

// POST /api/keys - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await parseBody<{ name: string }>(request, [
      'name',
    ]);
    if (error || !data) return error || badRequest('Invalid request');

    const result = await createApiKey(userId, data.name);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error('Error creating API key:', err);
    return errorResponse('Failed to create API key');
  }
}

// DELETE /api/keys?id=<keyId> - Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const userId = await requireAuth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { value: keyId, error } = getRequiredQueryParam(request, 'id');
    if (error || !keyId) return error || badRequest('Invalid request');

    await deleteApiKey(userId, keyId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting API key:', err);
    return errorResponse('Failed to delete API key');
  }
}
