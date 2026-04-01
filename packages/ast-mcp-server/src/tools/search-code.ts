import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { rgPath } from '@vscode/ripgrep';

const execFileAsync = promisify(execFile);

// Robust rg path resolution using the built-in rgPath and fallback logic
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resolvedRgPath =
  rgPath ||
  path.resolve(
    __dirname,
    '..',
    'node_modules',
    '@vscode',
    'ripgrep',
    'bin',
    'rg'
  );

export interface SearchResult {
  file: string;
  line: number;
  column: number;
  text: string;
}

export async function searchCode(
  pattern: string,
  searchPath: string,
  filePattern?: string,
  limit: number = 50
): Promise<SearchResult[]> {
  const args = [
    '--json',
    '--max-count',
    limit.toString(),
    '--fixed-strings', // Default to fixed strings unless we want regex
    pattern,
    searchPath,
  ];

  if (filePattern) {
    args.push('--glob', filePattern);
  }

  // Common exclusions
  args.push('--glob', '!**/node_modules/**');
  args.push('--glob', '!**/dist/**');
  args.push('--glob', '!**/.git/**');

  try {
    const { stdout } = await execFileAsync(rgPath, args);
    const lines = stdout.split('\n').filter(Boolean);
    const results: SearchResult[] = [];

    for (const line of lines) {
      const data = JSON.parse(line);
      if (data.type === 'match') {
        const file = data.data.path.text;
        const lineNumber = data.data.line_number;
        const submatches = data.data.submatches;

        for (const submatch of submatches) {
          results.push({
            file,
            line: lineNumber,
            column: submatch.start,
            text: data.data.lines.text.trim(),
          });
        }
      }
    }

    return results.slice(0, limit);
  } catch (error: any) {
    if (error.code === 1) {
      // rg returns 1 if no matches found
      return [];
    }
    throw error;
  }
}
