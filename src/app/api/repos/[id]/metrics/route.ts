import { NextRequest } from 'next/server';
import { getRepositoryMetrics } from '@/lib/db';
import { withRepoAuth } from '@/lib/api/repo-route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRepoAuth(request, params, async ({ request, params: { id } }) => {
    const searchParams = request.nextUrl.searchParams;
    const metricType = searchParams.get('type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    const metrics = await getRepositoryMetrics({
      repoId: id,
      metricType,
      limit,
    });

    return { metrics };
  });
}
