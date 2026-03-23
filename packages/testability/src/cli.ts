#!/usr/bin/env node

import { Command } from 'commander';
import { analyzeTestability } from './analyzer';
import { calculateTestabilityScore } from './scoring';
import type { TestabilityOptions } from './types';
import chalk from 'chalk';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import {
  resolveOutputPath,
  displayStandardConsoleReport,
  createStandardProgressCallback,
} from '@aiready/core';

const program = new Command();
const startTime = Date.now();

program
  .name('aiready-testability')
  .description(
    'Measure how safely AI-generated changes can be verified in your codebase'
  )
  .version('0.1.0')
  .addHelpText(
    'after',
    `
DIMENSIONS MEASURED:
  Test Coverage       Ratio of test files to source files
  Function Purity     Pure functions are trivially AI-testable
  Dependency Inject.  DI makes classes mockable and verifiable
  Interface Focus     Small interfaces are easier to mock
  Observability       Functions returning values > mutating state

AI CHANGE SAFETY RATINGS:
  safe           ✅ AI changes can be safely verified (≥50% coverage + score ≥70)
  moderate-risk  ⚠️  Some risk — partial test coverage
  high-risk      🔴 Tests exist but insufficient — AI changes may slip through
  blind-risk     💀 NO TESTS — AI changes cannot be verified at all

EXAMPLES:
  aiready-testability .                        # Full analysis
  aiready-testability src/ --output json       # JSON report
  aiready-testability . --min-coverage 0.5     # Stricter 50% threshold
`
  )
  .argument('<directory>', 'Directory to analyze')
  .option(
    '--min-coverage <ratio>',
    'Minimum acceptable test/source ratio (default: 0.3)',
    '0.3'
  )
  .option(
    '--test-patterns <patterns>',
    'Additional test file patterns (comma-separated)'
  )
  .option('--include <patterns>', 'File patterns to include (comma-separated)')
  .option('--exclude <patterns>', 'File patterns to exclude (comma-separated)')
  .option('-o, --output <format>', 'Output format: console|json', 'console')
  .option('--output-file <path>', 'Output file path (for json)')
  .action(async (directory, options) => {
    console.log(chalk.blue('🧪 Analyzing testability...\n'));

    const finalOptions: TestabilityOptions = {
      rootDir: directory,
      minCoverageRatio: parseFloat(options.minCoverage ?? '0.3'),
      testPatterns: options.testPatterns?.split(','),
      include: options.include?.split(','),
      exclude: options.exclude?.split(','),
      onProgress: createStandardProgressCallback('testability'),
    };

    const report = await analyzeTestability(finalOptions);
    const scoring = calculateTestabilityScore(report);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    if (options.output === 'json') {
      const payload = { report, score: scoring };
      const outputPath = resolveOutputPath(
        options.outputFile,
        `testability-report-${new Date().toISOString().split('T')[0]}.json`,
        directory
      );
      const dir = dirname(outputPath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(outputPath, JSON.stringify(payload, null, 2));
      console.log(chalk.green(`✓ Report saved to ${outputPath}`));
    } else {
      displayStandardConsoleReport({
        title: '🧪 Testability Analysis',
        score: scoring.score,
        rating: scoring.rating || report.summary.rating,
        dimensions: [
          {
            name: 'Test Coverage',
            value: report.summary.dimensions.testCoverageRatio,
          },
          {
            name: 'Function Purity',
            value: report.summary.dimensions.purityScore,
          },
          {
            name: 'Dependency Injection',
            value: report.summary.dimensions.dependencyInjectionScore,
          },
          {
            name: 'Interface Focus',
            value: report.summary.dimensions.interfaceFocusScore,
          },
          {
            name: 'Observability',
            value: report.summary.dimensions.observabilityScore,
          },
        ],
        stats: [
          { label: 'Source Files', value: report.rawData.sourceFiles },
          { label: 'Test Files', value: report.rawData.testFiles },
          {
            label: 'Coverage Ratio',
            value: Math.round(report.summary.coverageRatio * 100) + '%',
          },
        ],
        issues: report.issues,
        recommendations: report.recommendations,
        elapsedTime: elapsed,
        safetyRating: report.summary.aiChangeSafetyRating,
      });
    }
  });

program.parse();
