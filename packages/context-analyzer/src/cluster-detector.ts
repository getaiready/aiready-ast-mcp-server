import type { DependencyGraph, ModuleCluster } from './types';
import { calculateFragmentation, calculateEnhancedCohesion } from './metrics';

/**
 * Group files by domain to detect module clusters
 * @param graph - The dependency graph to analyze
 * @param options - Optional configuration options
 * @param options.useLogScale - Whether to use logarithmic scaling for calculations
 * @returns Array of module clusters
 */
export function detectModuleClusters(
  graph: DependencyGraph,
  options?: { useLogScale?: boolean }
): ModuleCluster[] {
  const domainMap = new Map<string, string[]>();

  for (const [file, node] of graph.nodes.entries()) {
    const primaryDomain = node.exports[0]?.inferredDomain || 'unknown';
    if (!domainMap.has(primaryDomain)) {
      domainMap.set(primaryDomain, []);
    }
    domainMap.get(primaryDomain)!.push(file);
  }

  const clusters: ModuleCluster[] = [];

  const generateSuggestedStructure = (
    files: string[],
    tokens: number,
    fragmentation: number
  ) => {
    const targetFiles = Math.max(1, Math.ceil(tokens / 10000));
    const plan: string[] = [];

    if (fragmentation > 0.5) {
      plan.push(
        `Consolidate ${files.length} files scattered across multiple directories into ${targetFiles} core module(s)`
      );
    }

    if (tokens > 20000) {
      plan.push(
        `Domain logic is very large (${Math.round(tokens / 1000)}k tokens). Ensure clear sub-domain boundaries.`
      );
    }

    return { targetFiles, consolidationPlan: plan };
  };

  for (const [domain, files] of domainMap.entries()) {
    if (files.length < 2 || domain === 'unknown') continue;

    const totalTokens = files.reduce((sum, file) => {
      const node = graph.nodes.get(file);
      return sum + (node?.tokenCost || 0);
    }, 0);

    // Calculate shared import ratio for coupling discount
    let sharedImportRatio = 0;
    if (files.length >= 2) {
      const allImportSets = files.map(
        (f) => new Set(graph.nodes.get(f)?.imports || [])
      );
      let intersection = new Set(allImportSets[0]);
      const union = new Set(allImportSets[0]);

      for (let i = 1; i < allImportSets.length; i++) {
        const nextSet = allImportSets[i];
        intersection = new Set([...intersection].filter((x) => nextSet.has(x)));
        for (const x of nextSet) union.add(x);
      }

      sharedImportRatio = union.size > 0 ? intersection.size / union.size : 0;
    }

    const fragmentation = calculateFragmentation(files, domain, {
      ...options,
      sharedImportRatio,
    });

    // Average cohesion for the cluster
    let totalCohesion = 0;
    files.forEach((f) => {
      const node = graph.nodes.get(f);
      if (node) totalCohesion += calculateEnhancedCohesion(node.exports);
    });
    const avgCohesion = totalCohesion / files.length;

    clusters.push({
      domain,
      files,
      totalTokens,
      fragmentationScore: fragmentation,
      avgCohesion,
      suggestedStructure: generateSuggestedStructure(
        files,
        totalTokens,
        fragmentation
      ),
    });
  }

  return clusters;
}

function generateSuggestedStructure(
  files: string[],
  tokens: number,
  fragmentation: number
) {
  const targetFiles = Math.max(1, Math.ceil(tokens / 10000));
  const plan: string[] = [];

  if (fragmentation > 0.5) {
    plan.push(
      `Consolidate ${files.length} files scattered across multiple directories into ${targetFiles} core module(s)`
    );
  }

  if (tokens > 20000) {
    plan.push(
      `Domain logic is very large (${Math.round(tokens / 1000)}k tokens). Ensure clear sub-domain boundaries.`
    );
  }

  return { targetFiles, consolidationPlan: plan };
}
