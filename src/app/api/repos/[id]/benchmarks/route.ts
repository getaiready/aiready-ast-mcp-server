import { NextRequest } from 'next/server';
import { getIndustryBenchmarks } from '@/lib/db/benchmarks';
import { withRepoAuth } from '@/lib/api/repo-route';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRepoAuth(req, params, async ({ repo }) => {
    try {
      const benchmarks = await getIndustryBenchmarks(repo.id);

      if (!benchmarks) {
        return { status: 404, error: 'Benchmark data unavailable' };
      }

      return { benchmarks };
    } catch (error) {
      console.error('[BenchmarksAPI] Error:', error);
      return { status: 500, error: 'Internal Server Error' };
    }
  });
}
