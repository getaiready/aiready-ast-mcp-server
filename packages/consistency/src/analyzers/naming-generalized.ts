/**
 * Generalized Naming Analyzer
 *
 * Uses the @aiready/core LanguageParser infrastructure to validate
 * naming conventions across all supported languages.
 */

import { getParser, Severity } from '@aiready/core';
import type { NamingIssue } from '../types';
import { readFileSync } from 'fs';

// Common abbreviations to whitelist
const COMMON_ABBREVIATIONS = new Set([
  'id',
  'db',
  'fs',
  'os',
  'ip',
  'ui',
  'ux',
  'api',
  'env',
  'url',
  'req',
  'res',
  'err',
  'ctx',
  'cb',
  'idx',
  'src',
  'dir',
  'app',
  'dev',
  'qa',
  'dto',
  'dao',
  'ref',
  'ast',
  'dom',
  'log',
  'msg',
  'pkg',
  'css',
  'html',
  'xml',
  'jsx',
  'tsx',
  'ts',
  'js',
]);

/**
 * Analyzes naming conventions using generalized LanguageParser metadata
 */
export async function analyzeNamingGeneralized(
  files: string[]
): Promise<NamingIssue[]> {
  const issues: NamingIssue[] = [];

  for (const file of files) {
    const parser = getParser(file);
    if (!parser) continue;

    try {
      const code = readFileSync(file, 'utf-8');
      if (!code.trim()) continue; // Skip empty files

      // Ensure parser is initialized (e.g. WASM loaded)
      await parser.initialize();
      const result = parser.parse(code, file);
      const conventions = parser.getNamingConventions();
      const exceptions = new Set(conventions.exceptions || []);

      // 1. Check Exports
      for (const exp of result.exports) {
        if (!exp.name || exp.name === 'default') continue;
        if (exceptions.has(exp.name)) continue;

        // Skip common abbreviations
        if (COMMON_ABBREVIATIONS.has(exp.name.toLowerCase())) continue;

        let pattern: RegExp | undefined;

        if (exp.type === 'class') {
          pattern = conventions.classPattern;
        } else if (exp.type === 'interface' && conventions.interfacePattern) {
          pattern = conventions.interfacePattern;
        } else if (exp.type === 'type' && conventions.typePattern) {
          pattern = conventions.typePattern;
        } else if (exp.type === 'function') {
          pattern = conventions.functionPattern;
        } else if (exp.type === 'const') {
          // Only enforce SCREAMING_SNAKE_CASE for primitive constants (strings, numbers,
          // booleans). Object literals, class instances, and tool definitions are
          // camelCase by convention (e.g. `logger`, `githubTools`, `RemediationSwarm`).
          pattern = exp.isPrimitive
            ? conventions.constantPattern
            : conventions.variablePattern;
        } else {
          pattern = conventions.variablePattern;
        }

        if (pattern && !pattern.test(exp.name)) {
          issues.push({
            type: 'naming-inconsistency',
            identifier: exp.name,
            file,
            line: exp.loc?.start.line || 1,
            column: exp.loc?.start.column || 0,
            // Recalibrate naming issues to Minor to differentiate from structural/architectural issues
            severity: Severity.Minor,
            category: 'naming',
            suggestion: `Follow ${parser.language} ${exp.type} naming convention: ${pattern.toString()}`,
          });
        }
      }

      // 2. Check Imports (basic check for specifier consistency)
      for (const imp of result.imports) {
        for (const spec of imp.specifiers) {
          if (!spec || spec === '*' || spec === 'default') continue;
          if (exceptions.has(spec)) continue;
          if (COMMON_ABBREVIATIONS.has(spec.toLowerCase())) continue;

          if (
            !conventions.variablePattern.test(spec) &&
            !conventions.classPattern.test(spec)
          ) {
            // This is often a 'convention-mix' issue (e.g. importing snake_case into camelCase project)
            issues.push({
              type: 'naming-inconsistency',
              identifier: spec,
              file,
              line: imp.loc?.start.line || 1,
              column: imp.loc?.start.column || 0,
              severity: Severity.Info, // Reduced from Minor to Info for imports
              category: 'naming',
              suggestion: `Imported identifier '${spec}' may not follow standard conventions for this language.`,
            });
          }
        }
      }
    } catch (error) {
      // Improved error handling
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.debug(
        `Consistency: Skipping unparseable file ${file}: ${errorMessage.split('\\n')[0]}`
      );
    }
  }

  return issues;
}
