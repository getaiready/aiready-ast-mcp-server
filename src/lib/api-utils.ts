import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Require authenticated user - returns user ID or null if unauthorized
 */
export async function requireAuth(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id || null;
}

/**
 * Create unauthorized response
 */
export function unauthorized(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Create bad request response
 */
export function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Create error response
 */
export function errorResponse(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Parse and validate required fields from request body
 */
export async function parseBody<T extends Record<string, unknown>>(
  request: NextRequest,
  requiredFields: (keyof T)[]
): Promise<{ data: T | null; error: NextResponse | null }> {
  try {
    const body = (await request.json()) as T;
    const missing = requiredFields.filter((field) => !body[field]);

    if (missing.length > 0) {
      const fieldList = missing.join(', ');
      return {
        data: null,
        error: badRequest(
          `${fieldList} ${missing.length === 1 ? 'is' : 'are'} required`
        ),
      };
    }

    return { data: body, error: null };
  } catch {
    return { data: null, error: badRequest('Invalid JSON body') };
  }
}

/**
 * Get required query param
 */
export function getRequiredQueryParam(
  request: NextRequest,
  param: string
): { value: string | null; error: NextResponse | null } {
  const { searchParams } = new URL(request.url);
  const value = searchParams.get(param);

  if (!value) {
    return {
      value: null,
      error: badRequest(`${param} is required`),
    };
  }

  return { value, error: null };
}

/**
 * Wrap API handler with standard auth and error handling
 */
export function withAuth(
  handler: (userId: string, request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const userId = await requireAuth();
      if (!userId) {
        return unauthorized();
      }
      return handler(userId, request);
    } catch (error) {
      console.error('API Error:', error);
      return errorResponse('Internal server error');
    }
  };
}
