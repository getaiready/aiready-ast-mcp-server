import { execFile } from 'child_process';
import { promisify } from 'util';
import { rgPath } from '@vscode/ripgrep';
import * as fs from 'fs';
import * as path from 'path';
import { validateWorkspacePath } from '../security.js';

const execFileAsync = promisify(execFile);

export interface CodebaseAuditResult {
  debtMarkers: number;
  emptyDirs: string[];
  orphanedFiles: string[];
}

/**
 * Performs a codebase-level audit for technical debt and bloat.
 * Uses ripgrep for fast searching of TODO/FIXME markers.
 */
export async function codebaseAudit(
  rootDir: string
): Promise<CodebaseAuditResult> {
  const safePath = validateWorkspacePath(rootDir);

  // 1. Count Debt Markers (TODO/FIXME)
  let debtMarkers = 0;
  try {
    const { stdout } = await execFileAsync(rgPath, [
      '--count-matches',
      '--fixed-strings',
      '-e',
      'TODO',
      '-e',
      'FIXME',
      '--glob',
      '!**/node_modules/**',
      '--glob',
      '!**/.git/**',
      '--glob',
      '!**/dist/**',
      safePath,
    ]);

    const lines = stdout.split('\n').filter(Boolean);
    for (const line of lines) {
      const match = line.match(/:(\d+)$/);
      if (match) {
        debtMarkers += parseInt(match[1], 10);
      }
    }
  } catch (error: any) {
    // rg returns 1 if no matches found
    if (error.code !== 1) {
      console.error('[Audit] Error counting debt markers:', error);
    }
  }

  // 2. Identify Empty Directories
  const emptyDirs: string[] = [];
  const scanEmpty = (dir: string) => {
    const files = fs.readdirSync(dir);
    if (files.length === 0) {
      emptyDirs.push(path.relative(safePath, dir));
      return;
    }
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        if (
          ['node_modules', '.git', 'dist', '.sst', '.turbo', '.next'].includes(
            file
          )
        )
          continue;
        scanEmpty(fullPath);
      }
    }
  };
  scanEmpty(safePath);

  // 3. Heuristic: Orphaned Files
  // Finds files that are not imported or mentioned by any other file
  const orphanedFiles: string[] = [];
  const allFiles: string[] = [];
  const collectFiles = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        if (
          ['node_modules', '.git', 'dist', '.sst', '.turbo', '.next'].includes(
            file
          )
        )
          continue;
        collectFiles(fullPath);
      } else if (
        file.endsWith('.ts') ||
        file.endsWith('.js') ||
        file.endsWith('.tsx') ||
        file.endsWith('.jsx')
      ) {
        allFiles.push(fullPath);
      }
    }
  };
  collectFiles(safePath);

  for (const file of allFiles) {
    const base = path.basename(file, path.extname(file));
    if (
      base === 'index' ||
      base.endsWith('.test') ||
      base.endsWith('.spec') ||
      base === 'sst.config'
    )
      continue;

    let referenced = false;
    // Use ripgrep to check if this file is referenced anywhere else
    try {
      // Search for the filename (without extension) in all files except itself
      const { status } = (await execFileAsync(rgPath, [
        '--quiet',
        '--fixed-strings',
        '--word-regexp',
        '--glob',
        `!${path.relative(safePath, file)}`,
        '--glob',
        '!**/node_modules/**',
        '--glob',
        '!**/.git/**',
        base,
        safePath,
      ])) as any;
      if (status === 0) referenced = true;
    } catch (e: any) {
      // 0 = found, 1 = not found
      if (e.code === 0) referenced = true;
    }

    if (!referenced) {
      orphanedFiles.push(path.relative(safePath, file));
    }
  }

  return {
    debtMarkers,
    emptyDirs,
    orphanedFiles,
  };
}
