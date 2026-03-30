import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRepository } from '@/lib/db';

type HandlerCtx = {
  request: NextRequest;
  params: { id: string };
  repo: any;
  session: any;
};

export async function withRepoAuth(
  request: NextRequest,
  paramsPromise: Promise<{ id: string }> | { id: string },
  handler: (ctx: HandlerCtx) => Promise<unknown>
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await paramsPromise;
    const repo = await getRepository(id);
    if (!repo) {
      return NextResponse.json(
        { error: 'Repository not found' },
        { status: 404 }
      );
    }
    if (repo.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await handler({ request, params: { id }, repo, session });
    if (result instanceof NextResponse) return result;
    // Allow handlers to return an object with a `status` number to control the response code
    if (result && typeof result === 'object' && 'status' in (result as any)) {
      const r: any = result as any;
      const status = typeof r.status === 'number' ? r.status : 200;
      const body = { ...r };
      delete body.status;
      return NextResponse.json(body, { status });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('Repo route failed:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
