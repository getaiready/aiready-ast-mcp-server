import { describe, it, expect, vi } from 'vitest';
import { withAuth, checkPlan } from '../middleware';
import { auth } from '../auth';
import { getUser, getTeam } from '../db';
import { NextResponse } from 'next/server';

vi.mock('../auth', () => ({
  auth: vi.fn(),
}));

vi.mock('../db', () => ({
  getUser: vi.fn(),
  getTeam: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

describe('Auth Middleware', () => {
  it('should return 401 if not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const handler = withAuth(async () => NextResponse.json({}));
    const req: any = {};
    const res = await handler(req);

    expect(res.status).toBe(401);
  });

  it('should allow access for valid user', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'u1' } } as any);
    vi.mocked(getUser).mockResolvedValue({ id: 'u1', email: 't@e.com' } as any);

    const handler = withAuth(async () => NextResponse.json({ ok: true }));
    const req: any = {};
    const res = await handler(req);

    expect(res.status).toBe(200);
  });

  describe('checkPlan', () => {
    it('should return true if user meets plan requirement', async () => {
      vi.mocked(getUser).mockResolvedValue({ id: 'u1', teamId: 't1' } as any);
      vi.mocked(getTeam).mockResolvedValue({ id: 't1', plan: 'pro' } as any);

      const result = await checkPlan('u1', 'free');
      expect(result.hasPlan).toBe(true);
    });
  });
});
