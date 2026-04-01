import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateWorkspacePath,
  resolveWorkspaceRoot,
} from '../src/security.js';
import path from 'path';

describe('security', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should resolve workspace root', () => {
    process.env.AST_WORKSPACE_ROOT = '/custom/root';
    expect(resolveWorkspaceRoot()).toBe('/custom/root');

    delete process.env.AST_WORKSPACE_ROOT;
    expect(resolveWorkspaceRoot()).toBe(process.cwd());
  });

  it('should allow paths within workspace', () => {
    process.env.AST_WORKSPACE_ROOT = '/workspace';
    expect(validateWorkspacePath('/workspace/src/index.ts')).toBe(
      path.normalize('/workspace/src/index.ts')
    );
    expect(validateWorkspacePath('./src/index.ts')).toBe(
      path.normalize('/workspace/src/index.ts')
    );
  });

  it('should reject path traversal', () => {
    process.env.AST_WORKSPACE_ROOT = '/workspace';
    expect(() => validateWorkspacePath('/etc/passwd')).toThrow(
      /escapes workspace root/
    );
    expect(() => validateWorkspacePath('../../../etc/passwd')).toThrow(
      /escapes workspace root/
    );
  });

  it('should reject null bytes', () => {
    process.env.AST_WORKSPACE_ROOT = '/workspace';
    expect(() => validateWorkspacePath('/workspace/src/in\0dex.ts')).toThrow(
      /null bytes/
    );
  });
});
