import { NextRequest } from 'next/server';
import { listRemediations } from '@/lib/db/remediation';
import { withRepoAuth } from '@/lib/api/repo-route';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withRepoAuth(req, params, async ({ repo }) => {
    try {
      const remediations = await listRemediations(repo.id);
      return { remediations };
    } catch (error) {
      console.error('[RemediationsAPI] Error:', error);
      return { status: 500, error: 'Internal Server Error' };
    }
  });
}
