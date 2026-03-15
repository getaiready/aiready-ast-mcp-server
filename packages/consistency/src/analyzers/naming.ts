import { readFileSync } from 'fs';
import { Severity } from '@aiready/core';
import type { NamingIssue } from '../types';

/**
 * Legacy regex-based naming analyzer
 * (Used as fallback or for languages without AST support)
 * @param filePaths - Array of file paths to analyze
 * @returns Array of naming issues found
 */
export async function analyzeNaming(
  filePaths: string[]
): Promise<NamingIssue[]> {
  const issues: NamingIssue[] = [];

  for (const filePath of filePaths) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        // Simple regex patterns for naming issues

        // 1. Single letter variables (except common ones)
        const singleLetterMatch = line.match(
          /\b(const|let|var)\s+([a-hj-km-np-zA-Z])\s*=/
        );
        if (singleLetterMatch) {
          issues.push({
            file: filePath,
            line: index + 1,
            type: 'poor-naming',
            identifier: singleLetterMatch[2],
            severity: Severity.Minor,
            suggestion: 'Use a more descriptive name than a single letter',
          });
        }

        // 2. Snake case in TS/JS files
        if (filePath.match(/\.(ts|tsx|js|jsx)$/)) {
          const snakeCaseMatch = line.match(
            /\b(const|let|var|function)\s+([a-z]+_[a-z0-9_]+)\b/
          );
          if (snakeCaseMatch) {
            issues.push({
              file: filePath,
              line: index + 1,
              type: 'convention-mix',
              identifier: snakeCaseMatch[2],
              severity: Severity.Info,
              suggestion:
                'Use camelCase instead of snake_case in TypeScript/JavaScript',
            });
          }
        }

        // 3. Very short names
        const shortNameMatch = line.match(
          /\b(const|let|var)\s+([a-zA-Z0-9]{2,3})\s*=/
        );
        if (shortNameMatch) {
          const name = shortNameMatch[2].toLowerCase();
          const vagueNames = ['obj', 'val', 'tmp', 'res', 'ret', 'data'];
          if (vagueNames.includes(name)) {
            issues.push({
              file: filePath,
              line: index + 1,
              type: 'poor-naming',
              identifier: name,
              severity: Severity.Minor,
              suggestion: `Avoid vague names like '${name}'`,
            });
          }
        }
      });
    } catch (err) {
      void err;
    }
  }

  return issues;
}
