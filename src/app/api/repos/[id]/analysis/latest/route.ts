import { NextRequest } from 'next/server';
import { getLatestAnalysis } from '@/lib/db';
import { getAnalysis, normalizeReport } from '@/lib/storage';
import { seedInitialRemediations } from '@/lib/db/seed-remediations';
import { withRepoAuth } from '@/lib/api/repo-route';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRepoAuth(
    _request,
    params,
    async ({ request: _req, repo, session }) => {
      try {
        const latestAnalysisRecord = await getLatestAnalysis(repo.id);
        if (!latestAnalysisRecord || !latestAnalysisRecord.rawKey) {
          return {
            status: 404,
            error: 'No analysis found for this repository',
            repo,
          };
        }

        // Seed initial remediations for alpha demo
        await seedInitialRemediations(repo.id, session.user.id);

        const fullAnalysis = await getAnalysis(latestAnalysisRecord.rawKey);
        if (!fullAnalysis) {
          return {
            status: 404,
            error: 'Analysis details not found in storage',
            repo,
          };
        }

        const normalizedAnalysis = normalizeReport(fullAnalysis, true);

        return {
          repo,
          analysis: normalizedAnalysis,
          timestamp: latestAnalysisRecord.timestamp,
        };
      } catch (error) {
        // _error is unused
        console.error('Error fetching latest analysis:', error);
        return { status: 500, error: 'Internal Server Error' };
      }
    }
  );
}
