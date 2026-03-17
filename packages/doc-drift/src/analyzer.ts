import {
  scanFiles,
  calculateDocDrift,
  getFileCommitTimestamps,
  getLineRangeLastModifiedCached,
  Severity,
  IssueType,
  emitProgress,
  getParser,
} from '@aiready/core';
import type { DocDriftOptions, DocDriftReport, DocDriftIssue } from './types';
import { readFileSync } from 'fs';

export async function analyzeDocDrift(
  options: DocDriftOptions
): Promise<DocDriftReport> {
  // Use core scanFiles which respects .gitignore recursively
  const files = await scanFiles(options);
  const issues: DocDriftIssue[] = [];
  const staleMonths = options.staleMonths ?? 6;
  const staleSeconds = staleMonths * 30 * 24 * 60 * 60;

  let uncommentedExports = 0;
  let totalExports = 0;
  let outdatedComments = 0;
  let undocumentedComplexity = 0;
  let actualDrift = 0;

  const now = Math.floor(Date.now() / 1000);

  let processed = 0;
  for (const file of files) {
    processed++;
    emitProgress(
      processed,
      files.length,
      'doc-drift',
      'analyzing files',
      options.onProgress
    );

    const parser = getParser(file);
    if (!parser) continue;

    let code: string;
    try {
      code = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }

    try {
      // Initialize parser (it's a singleton in core, but ensures WASM is loaded)
      await parser.initialize();
      const parseResult = parser.parse(code, file);

      let fileLineStamps: Record<number, number> | undefined;

      for (const exp of parseResult.exports) {
        // Only analyze functions and classes for documentation drift
        if (exp.type === 'function' || exp.type === 'class') {
          totalExports++;

          if (!exp.documentation) {
            uncommentedExports++;

            // Complexity check (heuristic based on line count if range available)
            if (exp.loc) {
              const lines = exp.loc.end.line - exp.loc.start.line;
              if (lines > 20) undocumentedComplexity++;
            }
          } else {
            const doc = exp.documentation;
            const docContent = doc.content;

            // Signature mismatch detection (generalized heuristic)
            if (exp.type === 'function' && exp.parameters) {
              const params = exp.parameters;
              // Check if params mentioned in doc (standard @param or simple mention)
              const missingParams = params.filter((p) => {
                const regex = new RegExp(`\\b${p}\\b`, 'i');
                return !regex.test(docContent);
              });

              if (missingParams.length > 0) {
                outdatedComments++;
                issues.push({
                  type: IssueType.DocDrift,
                  severity: Severity.Major,
                  message: `Documentation mismatch: function parameters (${missingParams.join(', ')}) are not mentioned in the docs.`,
                  location: { file, line: exp.loc?.start.line || 1 },
                });
              }
            }

            // Timestamp comparison for temporal drift
            if (exp.loc && doc.loc) {
              if (!fileLineStamps) {
                fileLineStamps = getFileCommitTimestamps(file);
              }

              const bodyModified = getLineRangeLastModifiedCached(
                fileLineStamps,
                exp.loc.start.line,
                exp.loc.end.line
              );

              const docModified = getLineRangeLastModifiedCached(
                fileLineStamps,
                doc.loc.start.line,
                doc.loc.end.line
              );

              if (bodyModified > 0 && docModified > 0) {
                // If body was modified more than 1 day AFTER the documentation
                const DRIFT_THRESHOLD_SECONDS = 24 * 60 * 60;
                if (bodyModified - docModified > DRIFT_THRESHOLD_SECONDS) {
                  actualDrift++;
                  issues.push({
                    type: IssueType.DocDrift,
                    severity: Severity.Major,
                    message: `Documentation drift: logic was modified on ${new Date(bodyModified * 1000).toLocaleDateString()} but documentation was last updated on ${new Date(docModified * 1000).toLocaleDateString()}.`,
                    location: { file, line: doc.loc.start.line },
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Doc-drift: Failed to parse ${file}: ${error}`);
      continue;
    }
  }

  const riskResult = calculateDocDrift({
    uncommentedExports,
    totalExports,
    outdatedComments,
    undocumentedComplexity,
    actualDrift,
  });

  return {
    summary: {
      filesAnalyzed: files.length,
      functionsAnalyzed: totalExports,
      score: riskResult.score,
      rating: riskResult.rating,
    },
    issues,
    rawData: {
      uncommentedExports,
      totalExports,
      outdatedComments,
      undocumentedComplexity,
      actualDrift,
    },
    recommendations: riskResult.recommendations,
  };
}
