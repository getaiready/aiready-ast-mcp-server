import { NextRequest, NextResponse } from 'next/server';
import { getRepository, getLatestAnalysis } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('repoId');
    const format = searchParams.get('format') || 'markdown';

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

    if (format === 'json') {
      return NextResponse.json({
        repoName: repo.name,
        aiScore: repo.aiScore,
        lastAnalysisAt: repo.lastAnalysisAt,
        summary: latest?.summary || null,
        topIssues: latest?.details?.slice(0, 5) || [],
      });
    }

    // Markdown format (optimized for LLM context)
    const markdown = `
# AI-Readiness Report: ${repo.name}
**Overall AI Score: ${repo.aiScore || 'N/A'}/100**
**Last Analyzed: ${repo.lastAnalysisAt ? new Date(repo.lastAnalysisAt).toLocaleString() : 'Never'}**

## Summary
- **Total Files:** ${latest?.summary?.totalFiles || 0}
- **Critical Issues:** ${latest?.summary?.criticalIssues || 0}
- **Warnings:** ${latest?.summary?.warnings || 0}
- **Context Fragmentation:** ${latest?.breakdown?.contextFragmentation || 'N/A'}

## Top Critical Issues
${
  latest?.details
    ?.slice(0, 5)
    .map((issue) => `- [${issue.type}] ${issue.file}: ${issue.message}`)
    .join('\n') || 'No issues found.'
}

## Recommendations
1. ${(latest?.summary?.criticalIssues || 0) > 0 ? 'Address critical context fragmentation issues first.' : 'Focus on improving naming consistency.'}
2. Use \`npx @aiready/cli fix\` to automatically address semantic duplicates.
    `.trim();

    return new NextResponse(markdown, {
      headers: { 'Content-Type': 'text/markdown' },
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
