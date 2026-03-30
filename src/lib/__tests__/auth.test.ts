import { describe, it, expect, vi } from 'vitest';
import { auth } from '../auth';

vi.mock('next-auth', () => ({
  default: vi.fn().mockReturnValue({
    auth: vi.fn(),
    handlers: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

describe('Auth Entry Point', () => {
  it('should export auth functions', () => {
    expect(auth).toBeDefined();
  });
});
