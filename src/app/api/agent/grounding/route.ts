import { NextRequest, NextResponse } from 'next/server';
import { getLatestAnalysis, getRepository } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('repoId');
    const query = searchParams.get('query')?.toLowerCase() || '';

    if (!repoId) {
      return NextResponse.json(
        { error: 'repoId is required' },
        { status: 400 }
      );
    }

    const repo = await getRepository(repoId);
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }

    const latest = await getLatestAnalysis(repoId);
    if (!latest) {
      return NextResponse.json({ error: 'No analysis found' }, { status: 404 });
    }

    // Simple keyword-based grounding logic for demonstration
    // In production, this would use vector search over analysis metadata
    const groundingResults = [
      {
        keyword: 'logic',
        cluster: 'core',
        files: ['src/lib/logic.ts', 'src/services/business.ts'],
        relevance: 0.95,
      },
      {
        keyword: 'ui',
        cluster: 'ui',
        files: [
          'src/components/Button.tsx',
          'app/dashboard/DashboardClient.tsx',
        ],
        relevance: 0.88,
      },
      {
        keyword: 'api',
        cluster: 'api-handlers',
        files: ['app/api/route.ts', 'src/lib/api-client.ts'],
        relevance: 0.92,
      },
    ];

    const match =
      groundingResults.find((r) => query.includes(r.keyword)) ||
      groundingResults[0];

    return NextResponse.json({
      repoName: repo.name,
      query,
      match: {
        ...match,
        reason:
          match.relevance > 0.9
            ? 'High semantic overlap with core modules'
            : 'Probable match based on directory structure',
      },
      advice:
        'Start exploration in the matched files to minimize context fragmentation tokens.',
    });
  } catch (error) {
    console.error('Grounding API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
