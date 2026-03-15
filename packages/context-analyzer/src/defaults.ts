import { scanFiles } from '@aiready/core';
import type { ContextAnalyzerOptions } from './types';

/**
 * Generate smart defaults for context analysis based on repository size
 * Automatically tunes thresholds to target ~10 most serious issues
 * @param directory - The root directory to analyze
 * @param userOptions - Partial user-provided options to merge with defaults
 * @returns Complete ContextAnalyzerOptions with smart defaults
 */
export async function getSmartDefaults(
  directory: string,
  userOptions: Partial<ContextAnalyzerOptions>
): Promise<ContextAnalyzerOptions> {
  // Estimate repository size by scanning files
  const files = await scanFiles({
    rootDir: directory,
    include: userOptions.include,
    exclude: userOptions.exclude,
  });

  const estimatedBlocks = files.length;

  let maxDepth: number;
  let maxContextBudget: number;
  let minCohesion: number;
  let maxFragmentation: number;

  if (estimatedBlocks < 100) {
    maxDepth = 4;
    maxContextBudget = 8000;
    minCohesion = 0.5;
    maxFragmentation = 0.5;
  } else if (estimatedBlocks < 500) {
    maxDepth = 5;
    maxContextBudget = 15000;
    minCohesion = 0.45;
    maxFragmentation = 0.6;
  } else if (estimatedBlocks < 2000) {
    maxDepth = 7;
    maxContextBudget = 25000;
    minCohesion = 0.4;
    maxFragmentation = 0.7;
  } else {
    maxDepth = 10;
    maxContextBudget = 40000;
    minCohesion = 0.35;
    maxFragmentation = 0.8;
  }

  return {
    maxDepth,
    maxContextBudget,
    minCohesion,
    maxFragmentation,
    focus: 'all',
    includeNodeModules: false,
    rootDir: userOptions.rootDir || directory,
    include: userOptions.include,
    exclude: userOptions.exclude,
  };
}
