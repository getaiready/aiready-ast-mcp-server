import { describe, it, expect } from 'vitest';
import { GraphBuilder } from '../graph-builder';

// Minimal report structure that mimics normalizeReport output
function makeReport(overrides: Record<string, any> = {}) {
  return {
    metadata: {
      repository: 'test-repo',
      branch: 'main',
      commit: 'abc',
      timestamp: '2026-01-01T00:00:00Z',
      toolVersion: '1.0',
    },
    summary: {
      aiReadinessScore: 80,
      totalFiles: 5,
      totalIssues: 3,
      criticalIssues: 1,
      warnings: 2,
    },
    breakdown: {},
    rawOutput: {
      patternDetect: { results: [], duplicates: [] },
      contextAnalyzer: { results: [], summary: {} },
      ...overrides,
    },
  };
}

describe('GraphBuilder', () => {
  describe('similarity edges', () => {
    it('creates similarity edges from per-file patternDetect results with "similar to" in message', () => {
      const report = makeReport({
        patternDetect: {
          results: [
            {
              fileName: 'src/utils.ts',
              issues: [
                {
                  type: 'duplicate-pattern',
                  severity: 'critical',
                  message:
                    'utility pattern 100% similar to src/helpers.ts (50 tokens wasted)',
                },
              ],
            },
          ],
          duplicates: [],
        },
      });

      const graph = GraphBuilder.buildFromReport(report);
      const simEdges = graph.edges.filter((e) => e.type === 'similarity');

      expect(simEdges).toHaveLength(1);
      expect(simEdges[0].source).toBe('src/utils.ts');
      expect(simEdges[0].target).toBe('src/helpers.ts');
    });

    it('assigns correct severity to duplicate files', () => {
      const report = makeReport({
        patternDetect: {
          results: [
            {
              fileName: 'packages/core/src/a.ts',
              issues: [
                {
                  severity: 'major',
                  message:
                    'pattern similar to packages/core/src/b.ts (20 tokens wasted)',
                },
              ],
            },
          ],
          duplicates: [],
        },
      });

      const graph = GraphBuilder.buildFromReport(report);
      const srcNode = graph.nodes.find(
        (n) => n.id === 'packages/core/src/a.ts'
      );
      const tgtNode = graph.nodes.find(
        (n) => n.id === 'packages/core/src/b.ts'
      );

      expect(srcNode?.severity).toBe('major');
      expect(tgtNode?.severity).toBe('major');
    });

    it('handles legacy file1/file2 duplicate format', () => {
      const report = makeReport({
        patternDetect: {
          results: [],
          duplicates: [
            { file1: 'src/a.ts', file2: 'src/b.ts', similarity: 0.96 },
          ],
        },
      });

      const graph = GraphBuilder.buildFromReport(report);
      const simEdges = graph.edges.filter((e) => e.type === 'similarity');
      expect(simEdges).toHaveLength(1);
      expect(simEdges[0].source).toBe('src/a.ts');
      expect(simEdges[0].target).toBe('src/b.ts');
    });

    it('does not create duplicate similarity edges', () => {
      const report = makeReport({
        patternDetect: {
          results: [
            {
              fileName: 'src/a.ts',
              issues: [
                {
                  severity: 'minor',
                  message: '90% similar to src/b.ts (10 tokens)',
                },
                {
                  severity: 'minor',
                  message: '90% similar to src/b.ts (10 tokens)',
                }, // duplicate message
              ],
            },
          ],
          duplicates: [],
        },
      });

      const graph = GraphBuilder.buildFromReport(report);
      const simEdges = graph.edges.filter(
        (e) =>
          e.type === 'similarity' &&
          e.source === 'src/a.ts' &&
          e.target === 'src/b.ts'
      );
      // addEdge deduplicates via edgesSet, so should be max 1
      expect(simEdges.length).toBeLessThanOrEqual(1);
    });
  });

  describe('reference edges', () => {
    it('creates reference edges from @/ alias imports in contextAnalyzer results', () => {
      const report = makeReport({
        contextAnalyzer: {
          results: [
            {
              file: 'platform/src/app/dashboard/DashboardClient.tsx',
              tokenCost: 5000,
              dependencyCount: 3,
              dependencyList: [
                'react',
                '@/components/PlatformShell',
                '@/lib/db',
              ],
            },
          ],
          summary: {},
        },
      });

      const graph = GraphBuilder.buildFromReport(report);
      const refEdges = graph.edges.filter((e) => e.type === 'reference');

      expect(refEdges.length).toBeGreaterThanOrEqual(2);
      const targets = refEdges.map((e) => e.target);
      expect(targets).toContain('@/components/PlatformShell');
      expect(targets).toContain('@/lib/db');
    });

    it('does NOT create reference edges for external npm packages', () => {
      const report = makeReport({
        contextAnalyzer: {
          results: [
            {
              file: 'src/index.ts',
              tokenCost: 1000,
              dependencyCount: 2,
              dependencyList: ['react', 'lodash', 'next/image'],
            },
          ],
          summary: {},
        },
      });

      const graph = GraphBuilder.buildFromReport(report);
      const refEdges = graph.edges.filter((e) => e.type === 'reference');
      expect(refEdges).toHaveLength(0);
    });
  });

  describe('dependency edges', () => {
    it('creates dependency edges for relative (.) imports', () => {
      const report = makeReport({
        contextAnalyzer: {
          results: [
            {
              file: 'packages/core/src/index.ts',
              tokenCost: 800,
              dependencyCount: 1,
              dependencyList: ['./utils', './../helpers/format'],
            },
          ],
          summary: {},
        },
      });

      const graph = GraphBuilder.buildFromReport(report);
      const depEdges = graph.edges.filter((e) => e.type === 'dependency');
      expect(depEdges.length).toBeGreaterThanOrEqual(2);
      expect(depEdges.map((e) => e.target)).toContain('./utils');
    });

    it('creates dependency edges for @aiready/* package imports', () => {
      const report = makeReport({
        contextAnalyzer: {
          results: [
            {
              file: 'packages/cli/src/index.ts',
              tokenCost: 600,
              dependencyCount: 1,
              dependencyList: ['@aiready/core', '@aiready/pattern-detect'],
            },
          ],
          summary: {},
        },
      });

      const graph = GraphBuilder.buildFromReport(report);
      const depEdges = graph.edges.filter((e) => e.type === 'dependency');
      expect(depEdges.map((e) => e.target)).toContain('@aiready/core');
    });
  });

  describe('token cost (context budget)', () => {
    it('populates tokenCost on nodes from contextAnalyzer results', () => {
      const report = makeReport({
        contextAnalyzer: {
          results: [
            {
              file: '/tmp/repo-abc/src/heavy.ts',
              tokenCost: 12000,
              dependencyCount: 0,
              dependencyList: [],
            },
          ],
          summary: {},
        },
      });

      const graph = GraphBuilder.buildFromReport(report);
      const node = graph.nodes.find((n) => n.id === 'src/heavy.ts');
      expect(node).toBeDefined();
      expect(node?.tokenCost).toBe(12000);
    });

    it('backfills tokenCost on nodes added by other tools', () => {
      const report = makeReport({
        contextAnalyzer: {
          results: [
            {
              file: 'src/shared.ts',
              tokenCost: 3000,
              dependencyCount: 0,
              dependencyList: [],
            },
          ],
          summary: {},
        },
        patternDetect: {
          results: [
            {
              // same file, added via pattern detect first
              fileName: 'src/shared.ts',
              issues: [
                {
                  severity: 'minor',
                  message: 'similar to src/other.ts (5 tokens)',
                },
              ],
            },
          ],
          duplicates: [],
        },
      });

      const graph = GraphBuilder.buildFromReport(report);
      const node = graph.nodes.find((n) => n.id === 'src/shared.ts');
      expect(node?.tokenCost).toBe(3000);
    });

    it('cleans /tmp/repo-xxx/ prefix from file paths', () => {
      const tmpPath =
        '/tmp/repo-69d0092d-f85c-4c4e-8bca-1717ee89f405/packages/core/src/index.ts';
      const report = makeReport({
        contextAnalyzer: {
          results: [
            {
              file: tmpPath,
              tokenCost: 500,
              dependencyCount: 0,
              dependencyList: [],
            },
          ],
          summary: {},
        },
      });

      const graph = GraphBuilder.buildFromReport(report);
      const hasAbsPath = graph.nodes.some((n) => n.id.startsWith('/tmp/'));
      expect(hasAbsPath).toBe(false);

      const node = graph.nodes.find(
        (n) => n.id === 'packages/core/src/index.ts'
      );
      expect(node).toBeDefined();
    });
  });

  describe('structural edges', () => {
    it('creates structural edges from package group to file', () => {
      const report = makeReport({
        contextAnalyzer: {
          results: [
            {
              file: 'packages/core/src/index.ts',
              tokenCost: 400,
              dependencyCount: 0,
              dependencyList: [],
            },
          ],
          summary: {},
        },
      });

      const graph = GraphBuilder.buildFromReport(report);
      const structEdges = graph.edges.filter((e) => e.type === 'structural');
      expect(structEdges.length).toBeGreaterThan(0);
      expect(structEdges[0].source).toBe('packages/core');
    });
  });

  describe('metadata', () => {
    it('returns graph metadata with counts', () => {
      const report = makeReport({
        contextAnalyzer: {
          results: [
            {
              file: 'src/a.ts',
              tokenCost: 100,
              dependencyCount: 0,
              dependencyList: [],
            },
            {
              file: 'src/b.ts',
              tokenCost: 200,
              dependencyCount: 0,
              dependencyList: [],
            },
          ],
          summary: {},
        },
      });

      const graph = GraphBuilder.buildFromReport(report);
      expect(graph.metadata).toBeDefined();
      expect(graph.metadata!.totalFiles).toBeGreaterThanOrEqual(2);
    });
  });
});
