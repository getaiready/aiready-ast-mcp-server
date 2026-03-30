import { NextRequest } from 'next/server';
import { listRepositoryAnalyses } from '@/lib/db';
import { withRepoAuth } from '@/lib/api/repo-route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRepoAuth(request, params, async ({ request, params: { id } }) => {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    const analyses = await listRepositoryAnalyses(id, limit + 5); // Fetch a few extra to account for filtering

    const filtered = analyses
      .filter(
        (a) => a.status === 'completed' || (!a.status && (a.aiScore || 0) > 0)
      )
      .slice(0, limit);

    return { analyses: filtered };
  });
}
