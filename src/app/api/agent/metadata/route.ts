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

    // Create ai-ready.json metadata structure
    const metadata = {
      version: '1.0',
      projectName: repo.name,
      aiReadinessScore: repo.aiScore || 0,
      timestamp: new Date().toISOString(),
      entryPoints: [
        'src/index.ts',
        'src/main.ts',
        'app/page.tsx',
        'package.json',
      ],
      aiInfrastructure: {
        analyzedAt: repo.lastAnalysisAt,
        summary: latest?.summary || {},
        groundingScore: latest?.breakdown?.agentGrounding || 0,
        contextFragmentation: latest?.breakdown?.contextFragmentation || 0,
      },
      agentProtocols: {
        contextMap: `/api/agent/context-map?repoId=${repoId}`,
        remediate: `/api/agent/remediate?repoId=${repoId}`,
        grounding: `/api/agent/grounding?repoId=${repoId}`,
        stats: `/api/agent/repo-stats?repoId=${repoId}`,
      },
    };

    return NextResponse.json(metadata, {
      headers: {
        'Content-Disposition': `attachment; filename="ai-ready-${repo.name}.json"`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Metadata API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
