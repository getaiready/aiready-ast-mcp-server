import { describe, it, expect, vi } from 'vitest';
import { authConfig } from '../auth.config';

vi.mock('../db', () => ({
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
  },
}));

describe('Auth Config', () => {
  it('should have required providers', () => {
    const providerIds = (authConfig.providers as any).map((p: any) => p.id);
    expect(providerIds).toContain('github');
    expect(providerIds).toContain('google');
    expect(providerIds).toContain('credentials');
  });

  describe('callbacks', () => {
    it('should update session with token data', async () => {
      const session: any = { user: {} };
      const token: any = { id: 'u1', email: 't@e.com', name: 'Test' };

      const result = await (authConfig.callbacks as any).session({
        session,
        token,
        user: {} as any,
      });
      expect(result.user.id).toBe('u1');
      expect(result.user.email).toBe('t@e.com');
    });

    it('should authorize dashboard access when logged in', () => {
      const auth = { user: { id: '1' } };
      const request = { nextUrl: { pathname: '/dashboard' } };

      const result = authConfig.callbacks?.authorized?.({
        auth,
        request,
      } as any);
      expect(result).toBe(true);
    });

    it('should redirect unauthenticated dashboard access', () => {
      const auth = null;
      const request = { nextUrl: { pathname: '/dashboard' } };

      const result = authConfig.callbacks?.authorized?.({
        auth,
        request,
      } as any);
      expect(result).toBe(false);
    });
  });
});
