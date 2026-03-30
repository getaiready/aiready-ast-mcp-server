import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const repoId = searchParams.get('repoId');
    const partner = searchParams.get('partner') || 'cline';

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

    const baseUrl = process.env.NEXTAUTH_URL || 'https://getaiready.dev';

    const configs: Record<string, any> = {
      cline: {
        name: 'Cline / Claude Code',
        instructions: `Before starting any task, check for ai-ready.json. If present, use the AIReady Grounding API: ${baseUrl}/api/agent/grounding?repoId=${repoId}&query={YOUR_QUERY} to identify core clusters and context hotspots.`,
        rulesPath: '.clinerules',
      },
      aider: {
        name: 'Aider',
        instructions: `To optimize context, first get remediation steps from AIReady: curl ${baseUrl}/api/agent/remediate?repoId=${repoId}. Apply these refactors using Aider to reduce context fragmentation.`,
        suggestedCommand: `aider --msg "Optimize context via AIReady remediation suggestions"`,
      },
    };

    const config = configs[partner] || configs.cline;

    return NextResponse.json(config);
  } catch (error: any) {
    if (error.name === 'ResourceNotFoundException') {
      return NextResponse.json(
        { error: 'Repository not found (Database not configured)' },
        { status: 404 }
      );
    }
    console.error('Partner Config API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
