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
      return NextResponse.json({ error: 'No analysis found' }, { status: 404 });
    }

    // Identify high-impact issues for remediation
    const criticalIssues = (latest.details || []).filter(
      (i: any) => i.severity === 'critical'
    );

    // Generate remediation suggestions
    const suggestions = criticalIssues.map((issue: any, idx: number) => ({
      id: `rem-${idx}`,
      type: issue.type === 'duplicate-pattern' ? 'consolidation' : 'refactor',
      risk: 'medium',
      title: `${issue.type === 'duplicate-pattern' ? 'Consolidate' : 'Fix'} ${issue.file}`,
      description: issue.message,
      affectedFiles: [issue.file, ...(issue.relatedFiles || [])],
      estimatedSavings: 1200, // placeholder token savings
      status: 'pending',
      action:
        issue.type === 'duplicate-pattern'
          ? `npx @aiready/cli fix --file ${issue.file} --strategy consolidate`
          : `npx @aiready/cli fix --file ${issue.file} --strategy cleanup`,
    }));

    return NextResponse.json({
      repoName: repo.name,
      remediationQueue: suggestions,
      totalPotentialSavings: suggestions.reduce(
        (acc: number, s: any) => acc + s.estimatedSavings,
        0
      ),
    });
  } catch (error) {
    console.error('Remediation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
