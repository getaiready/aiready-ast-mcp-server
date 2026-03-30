import { describe, it, expect } from 'vitest';
import { calculateAiScore, normalizeReport } from '../storage';
import { ToolName } from '@aiready/core/client';

describe('Storage Utilities', () => {
  describe('calculateAiScore', () => {
    it('should calculate weighted average correctly', () => {
      const data = {
        breakdown: {
          [ToolName.PatternDetect]: 80,
          [ToolName.ContextAnalyzer]: 60,
        },
      };

      // Weights: PatternDetect=22, ContextAnalyzer=19
      // (80*22 + 60*19) / (22+19) = (1760 + 1140) / 41 = 2900 / 41 = 70.73 -> 71
      const score = calculateAiScore(data as any);
      expect(score).toBe(71);
    });

    it('should respect overrides', () => {
      const data = {
        breakdown: {
          [ToolName.PatternDetect]: 100,
          [ToolName.ContextAnalyzer]: 0,
        },
      };
      const overrides = {
        [ToolName.ContextAnalyzer]: { enabled: false },
      };

      const score = calculateAiScore(data as any, overrides);
      expect(score).toBe(100);
    });
  });

  describe('normalizeReport', () => {
    it('should normalize raw report into AnalysisData', () => {
      const raw = {
        results: [
          {
            fileName: 'f1.ts',
            issues: [
              { type: 'magic-literal', severity: 'major', message: 'test' },
            ],
          },
        ],
        summary: { totalFiles: 1 },
      };

      const normalized = normalizeReport(raw);
      expect(normalized.summary.totalFiles).toBe(1);
      expect(normalized.breakdown[ToolName.AiSignalClarity]).toBeDefined();
      expect(normalized.breakdown[ToolName.AiSignalClarity].count).toBe(1);
    });
  });
});
