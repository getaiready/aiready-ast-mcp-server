import { useMemo } from 'react';
import { AIReadyConfig, ToolName } from '@aiready/core/client';

export function useExecutionEstimator(
  settings: AIReadyConfig,
  fileCount: number,
  lastExecutionTime: number,
  lastSettings: AIReadyConfig | null
) {
  return useMemo(() => {
    if (fileCount === 0) return null;

    // 1. Calculate base estimate using heuristics
    const calculateHeuristic = (cfg: AIReadyConfig | null) => {
      if (!cfg) return 60;

      // Use a floor for estimation to show meaningful changes even on small repos
      const estFileCount = Math.max(fileCount, 100);

      let seconds = 35; // Base overhead (provisioning, cloning, setup)
      const activeTools = cfg.scan?.tools || [];

      // Core file scanning & parsing (0.1s per file)
      seconds += estFileCount * 0.1;

      // Pattern Detection (The most expensive O(N^2) tool)
      if (
        activeTools.includes(ToolName.PatternDetect) ||
        activeTools.includes('patterns')
      ) {
        const toolCfg =
          cfg.tools?.[ToolName.PatternDetect] ||
          (cfg.tools as any)?.['patterns'];
        const minLines = toolCfg?.minLines || 5;
        const minSimilarity = toolCfg?.minSimilarity || 0.8;
        const approx = toolCfg?.approx !== false;
        const maxCandidates = toolCfg?.maxCandidatesPerBlock || 100;
        const minTokens = toolCfg?.minSharedTokens || 10;

        // minLines impact: number of blocks scales inversely with minLines
        const blocksPerFile = 7 * (5 / minLines);
        const blocks = estFileCount * blocksPerFile;
        const totalComparisons = (blocks * blocks) / 2;

        if (approx) {
          // Candidate selection cost
          seconds += blocks * 0.005;

          // Verification cost (Highly sensitive to minTokens and maxCandidates)
          const tokenFactor = 2.0 - minTokens / 10; // More tokens = less work
          const verificationWork = blocks * maxCandidates * tokenFactor;
          seconds += verificationWork / 10000;
        } else {
          // Exhaustive mode (Very expensive)
          const pruningFactor = 1.2 - minSimilarity; // Higher similarity = faster pruning
          const comparisonWork = totalComparisons * pruningFactor;

          // maxCandidates dramatically increases verification depth
          const workFactor = 1 + maxCandidates / 10;
          seconds += (comparisonWork * workFactor) / 18000;
        }
      }

      // Context Analyzer
      if (
        activeTools.includes(ToolName.ContextAnalyzer) ||
        activeTools.includes('context')
      ) {
        const toolCfg =
          cfg.tools?.[ToolName.ContextAnalyzer] ||
          (cfg.tools as any)?.['context'];
        const depth = toolCfg?.maxDepth || 5;
        seconds += estFileCount * 0.2 * Math.pow(1.6, depth - 5);
      }

      // Other tools
      const otherToolsCount = activeTools.filter(
        (t) =>
          t !== ToolName.PatternDetect &&
          t !== 'patterns' &&
          t !== ToolName.ContextAnalyzer &&
          t !== 'context'
      ).length;
      seconds += estFileCount * 0.04 * otherToolsCount;

      // Post-processing (Normalization, DB updates, Score calculation)
      seconds += 25 + estFileCount * 0.03;

      return seconds;
    };

    const currentHeuristic = calculateHeuristic(settings);

    // 2. Refine using historical data if available
    if (lastExecutionTime > 0 && lastSettings) {
      const historicalHeuristic = calculateHeuristic(lastSettings);
      const lastSeconds = lastExecutionTime / 1000;

      // Correction factor: how much faster or slower the real repo is compared to heuristic
      const correctionFactor = Math.min(
        Math.max(lastSeconds / historicalHeuristic, 0.2),
        5.0
      );

      return Math.round(currentHeuristic * correctionFactor);
    }

    return Math.round(currentHeuristic);
  }, [settings, fileCount, lastExecutionTime, lastSettings]);
}
