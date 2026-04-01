import path from 'path';
import fs from 'fs';

export function resolveWorkspaceRoot(): string {
  return process.env.AST_WORKSPACE_ROOT || process.cwd();
}

export function validateWorkspacePath(inputPath: string): string {
  const root = resolveWorkspaceRoot();
  const resolved = path.resolve(root, inputPath);
  const normalized = path.normalize(resolved);

  // Reject path traversal
  if (!normalized.startsWith(root)) {
    throw new Error(
      `Path traversal detected: ${inputPath} escapes workspace root`
    );
  }

  // Reject null bytes
  if (normalized.includes('\0')) {
    throw new Error('Path contains null bytes');
  }

  return normalized;
}

export function validateFileExists(filePath: string): string {
  const safe = validateWorkspacePath(filePath);
  if (!fs.existsSync(safe)) {
    throw new Error(`File not found: ${filePath}`);
  }
  if (!fs.statSync(safe).isFile()) {
    throw new Error(`Not a file: ${filePath}`);
  }
  return safe;
}
