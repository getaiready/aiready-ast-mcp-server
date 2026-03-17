import { describe, it, expect, vi } from 'vitest';
import { DocDriftProvider } from '../provider';
import * as analyzer from '../analyzer';

vi.mock('../analyzer', () => ({
  analyzeDocDrift: vi.fn(),
}));

describe('Doc Drift Provider', () => {
  it('should analyze and return SpokeOutput', async () => {
    vi.mocked(analyzer.analyzeDocDrift).mockResolvedValue({
      summary: {
        filesAnalyzed: 1,
        functionsAnalyzed: 5,
        score: 90,
        rating: 'minimal',
      },
      issues: [],
      rawData: {
        uncommentedExports: 0,
        totalExports: 5,
        outdatedComments: 0,
        undocumentedComplexity: 0,
        actualDrift: 0,
      },
      recommendations: [],
    });

    const output = await DocDriftProvider.analyze({ rootDir: '.' });

    expect(output.summary.filesAnalyzed).toBe(1);
    expect(output.metadata!.toolName).toBe('doc-drift');
  });

  it('should score an output', () => {
    const mockOutput = {
      summary: { score: 80, recommendations: ['Fix it'] } as any,
      metadata: { rawData: {} },
      results: [],
    };

    const scoring = DocDriftProvider.score(mockOutput as any, { rootDir: '.' });
    expect(scoring.score).toBe(80);
    expect(scoring.recommendations[0].action).toBe('Fix it');
  });
});
