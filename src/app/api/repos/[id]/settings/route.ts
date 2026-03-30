import { NextRequest } from 'next/server';
import { updateRepositoryConfig } from '@/lib/db';
import { withRepoAuth } from '@/lib/api/repo-route';

// GET /api/repos/[repoId]/settings - Get repository settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRepoAuth(request, params, async ({ repo }) => {
    try {
      return { settings: repo.scanConfig || null };
    } catch (error) {
      console.error('Error fetching repo settings:', error);
      return { status: 500, error: 'Failed to fetch settings' };
    }
  });
}

// PATCH /api/repos/[repoId]/settings - Update repository settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRepoAuth(request, params, async ({ request, repo }) => {
    try {
      const body = await request.json();
      const { settings } = body; // settings can be null for reset

      await updateRepositoryConfig(repo.id, settings);

      return { success: true, settings };
    } catch (error) {
      console.error('Error updating repo settings:', error);
      return { status: 500, error: 'Failed to update settings' };
    }
  });
}
