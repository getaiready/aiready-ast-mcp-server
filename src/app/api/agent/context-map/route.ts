import { NextRequest, NextResponse } from 'next/server';
import { getLatestAnalysis, getRepository } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('repoId');

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
      return NextResponse.json(
        { error: 'No analysis found for this repository' },
        { status: 404 }
      );
    }

    // In a real implementation, we would fetch the full graphData from S3 using latest.rawKey.
    // For this demonstration, we'll suggest clusters based on the analysis summary and issues.

    const contextMap = {
      repoName: repo.name,
      overallScore: repo.aiScore,
      lastAnalyzed: repo.lastAnalysisAt,
      clusters: [
        {
          id: 'core',
          name: 'Core Business Logic',
          description: 'High-value logic with moderate fragmentation.',
          fileCount: Math.ceil(latest.summary.totalFiles * 0.3),
          severity: 'major',
          recommendation:
            'Extract common validation patterns to reduce context waste.',
        },
        {
          id: 'utils',
          name: 'Utilities & Helpers',
          description: 'Common utility functions, high risk of duplication.',
          fileCount: Math.ceil(latest.summary.totalFiles * 0.2),
          severity: latest.summary.criticalIssues > 0 ? 'critical' : 'minor',
          recommendation:
            'Consolidate semantic duplicates in date and currency formatting.',
        },
        {
          id: 'ui',
          name: 'UI Components',
          description: 'Presentation layer, low complexity.',
          fileCount: Math.ceil(latest.summary.totalFiles * 0.5),
          severity: 'info',
          recommendation:
            'Ensure consistent prop-typing for better AI agent navigation.',
        },
      ],
      hotspots: (latest.details || []).slice(0, 3).map((issue: any) => ({
        file: issue.file,
        issue: issue.type,
        impact: issue.severity,
      })),
    };

    return NextResponse.json(contextMap);
  } catch (error) {
    console.error('Context Map API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
