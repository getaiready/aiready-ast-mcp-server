import { calculateDocDrift, ToolName } from '@aiready/core';
import type { ToolScoringOutput } from '@aiready/core';
import type { DocDriftReport } from './types';

/**
 * Convert doc-drift report into a ToolScoringOutput.
 */
export function calculateDocDriftScore(
  report: DocDriftReport
): ToolScoringOutput {
  const { rawData, summary } = report;

  // Recalculate using core math to get risk contribution breakdown
  const riskResult = calculateDocDrift({
    uncommentedExports: rawData.uncommentedExports,
    totalExports: rawData.totalExports,
    outdatedComments: rawData.outdatedComments,
    undocumentedComplexity: rawData.undocumentedComplexity,
    actualDrift: rawData.actualDrift,
  });

  const factors: ToolScoringOutput['factors'] = [
    {
      name: 'Undocumented Complexity',
      impact: -Math.min(
        50,
        (rawData.undocumentedComplexity /
          Math.max(1, rawData.totalExports) /
          0.2) *
          100 *
          0.5
      ),
      description: `${rawData.undocumentedComplexity} complex functions lack docs (high risk)`,
    },
    {
      name: 'Outdated/Incomplete Comments',
      impact: -Math.min(
        30,
        (rawData.outdatedComments / Math.max(1, rawData.totalExports) / 0.4) *
          100 *
          0.3
      ),
      description: `${rawData.outdatedComments} functions with parameter-mismatch in docs`,
    },
    {
      name: 'Uncommented Exports',
      impact: -Math.min(
        20,
        (rawData.uncommentedExports / Math.max(1, rawData.totalExports) / 0.8) *
          100 *
          0.2
      ),
      description: `${rawData.uncommentedExports} uncommented exports`,
    },
  ];

  const recommendations: ToolScoringOutput['recommendations'] =
    riskResult.recommendations.map((rec) => ({
      action: rec,
      estimatedImpact: 8,
      priority: summary.score < 50 ? 'high' : 'medium',
    }));

  return {
    toolName: ToolName.DocDrift,
    score: summary.score,
    rawMetrics: {
      ...rawData,
      rating: summary.rating,
    },
    factors,
    recommendations,
  };
}
