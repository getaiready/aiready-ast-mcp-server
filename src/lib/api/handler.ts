import { NextRequest, NextResponse } from 'next/server';

export async function withApiHandler(
  handler: (request: NextRequest, params?: any) => Promise<unknown>,
  request: NextRequest,
  params?: any
) {
  try {
    const result = await handler(request, params);
    if (result instanceof NextResponse) return result;
    if (result && typeof result === 'object' && 'status' in (result as any)) {
      const r: any = result as any;
      const status = typeof r.status === 'number' ? r.status : 200;
      const body = { ...r };
      delete body.status;
      return NextResponse.json(body, { status });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error('API handler error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
