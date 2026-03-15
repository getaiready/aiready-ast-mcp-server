import {
  calculateMonthlyCost,
  calculateProductivityImpact,
  DEFAULT_COST_CONFIG,
  type CostConfig,
  ToolName,
  getRatingSlug,
} from '@aiready/core';
import type { ToolScoringOutput } from '@aiready/core';
import type { ContextSummary } from './types';

/**
 * Calculate AI Readiness Score for context efficiency (0-100)
 */
export function calculateContextScore(
  summary: ContextSummary,
  costConfig?: Partial<CostConfig>
): ToolScoringOutput {
  const {
    avgContextBudget,
    maxContextBudget,
    avgImportDepth,
    maxImportDepth,
    avgFragmentation,
    criticalIssues,
    majorIssues,
    totalFiles,
  } = summary;

  // More reasonable thresholds for modern codebases
  const budgetScore =
    avgContextBudget < 8000
      ? 100
      : Math.max(0, 100 - (avgContextBudget - 8000) / 200);

  const depthScore =
    avgImportDepth < 8 ? 100 : Math.max(0, 100 - (avgImportDepth - 8) * 5);

  const fragmentationScore =
    avgFragmentation < 0.5
      ? 100
      : Math.max(0, 100 - (avgFragmentation - 0.5) * 100);

  // Cap penalties to prevent score going to 0
  const criticalPenalty = Math.min(20, criticalIssues * 3); // Max 20 points
  const majorPenalty = Math.min(15, majorIssues * 1); // Max 15 points

  const maxBudgetPenalty =
    maxContextBudget > 15000
      ? Math.min(20, (maxContextBudget - 15000) / 500)
      : 0;

  // Add bonus for well-organized codebases
  let bonus = 0;
  if (criticalIssues === 0 && majorIssues === 0 && avgFragmentation < 0.2) {
    bonus = 5; // Well-organized codebase bonus
  }

  const rawScore =
    budgetScore * 0.35 + depthScore * 0.25 + fragmentationScore * 0.25 + bonus;
  const finalScore =
    rawScore - Math.min(30, criticalPenalty + majorPenalty) - maxBudgetPenalty;

  const score = Math.max(0, Math.min(100, Math.round(finalScore)));

  const factors = [
    {
      name: 'Context Budget',
      impact: Math.round(budgetScore * 0.35 - 35),
      description: `Avg ${Math.round(avgContextBudget)} tokens per file ${avgContextBudget < 8000 ? '(excellent)' : avgContextBudget < 12000 ? '(acceptable)' : '(high)'}`,
    },
    {
      name: 'Import Depth',
      impact: Math.round(depthScore * 0.25 - 25),
      description: `Avg ${avgImportDepth.toFixed(1)} levels ${avgImportDepth < 8 ? '(excellent)' : avgImportDepth < 12 ? '(acceptable)' : '(deep)'}`,
    },
    {
      name: 'Fragmentation',
      impact: Math.round(fragmentationScore * 0.25 - 25),
      description: `${(avgFragmentation * 100).toFixed(0)}% fragmentation ${avgFragmentation < 0.3 ? '(well-organized)' : avgFragmentation < 0.5 ? '(moderate)' : '(high)'}`,
    },
  ];

  if (bonus > 0) {
    factors.push({
      name: 'Well-Organized Codebase',
      impact: bonus,
      description: 'No critical/major issues and low fragmentation',
    });
  }

  if (criticalIssues > 0) {
    factors.push({
      name: 'Critical Issues',
      impact: -criticalPenalty,
      description: `${criticalIssues} critical context issue${criticalIssues > 1 ? 's' : ''}`,
    });
  }

  if (majorIssues > 0) {
    factors.push({
      name: 'Major Issues',
      impact: -majorPenalty,
      description: `${majorIssues} major context issue${majorIssues > 1 ? 's' : ''}`,
    });
  }

  if (maxBudgetPenalty > 0) {
    factors.push({
      name: 'Extreme File Detected',
      impact: -Math.round(maxBudgetPenalty),
      description: `One file requires ${Math.round(maxContextBudget)} tokens (very high)`,
    });
  }

  const recommendations: ToolScoringOutput['recommendations'] = [];

  if (avgContextBudget > 12000) {
    const estimatedImpact = Math.min(
      15,
      Math.round((avgContextBudget - 12000) / 1000)
    );
    recommendations.push({
      action: 'Reduce file dependencies to lower context requirements',
      estimatedImpact,
      priority: 'high',
    });
  }

  if (avgImportDepth > 10) {
    const estimatedImpact = Math.min(
      10,
      Math.round((avgImportDepth - 10) * 1.5)
    );
    recommendations.push({
      action: 'Flatten import chains to reduce depth',
      estimatedImpact,
      priority: avgImportDepth > 15 ? 'high' : 'medium',
    });
  }

  if (avgFragmentation > 0.5) {
    const estimatedImpact = Math.min(
      12,
      Math.round((avgFragmentation - 0.5) * 40)
    );
    recommendations.push({
      action: 'Consolidate related code into cohesive modules',
      estimatedImpact,
      priority: 'medium',
    });
  }

  if (maxContextBudget > 20000) {
    recommendations.push({
      action: `Split large file (${Math.round(maxContextBudget)} tokens) into smaller modules`,
      estimatedImpact: 8,
      priority: 'high',
    });
  }

  const cfg = { ...DEFAULT_COST_CONFIG, ...costConfig };
  const estimatedMonthlyCost = calculateMonthlyCost(
    avgContextBudget * (totalFiles || 1),
    cfg
  );

  const issues = [
    ...Array(criticalIssues).fill({ severity: 'critical' as const }),
    ...Array(majorIssues).fill({ severity: 'major' as const }),
  ];
  const productivityImpact = calculateProductivityImpact(issues);

  return {
    toolName: ToolName.ContextAnalyzer,
    score,
    rawMetrics: {
      avgContextBudget: Math.round(avgContextBudget),
      maxContextBudget: Math.round(maxContextBudget),
      avgImportDepth: Math.round(avgImportDepth * 10) / 10,
      maxImportDepth,
      avgFragmentation: Math.round(avgFragmentation * 100) / 100,
      criticalIssues,
      majorIssues,
      estimatedMonthlyCost,
      estimatedDeveloperHours: productivityImpact.totalHours,
    },
    factors,
    recommendations,
  };
}

export function mapScoreToRating(score: number): string {
  // Use core implementation to resolve duplication
  return getRatingSlug(score).replace('-', ' ');
}
