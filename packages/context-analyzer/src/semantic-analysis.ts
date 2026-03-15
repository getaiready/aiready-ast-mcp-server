import type {
  DependencyGraph,
  CoUsageData,
  DomainAssignment,
  DomainSignals,
  ExportInfo,
} from './types';
import { singularize } from './utils/string-utils';

/**
 * Build co-usage matrix: track which files are imported together
 * @param graph - The dependency graph to analyze
 * @returns Map of file to co-usage counts
 */
export function buildCoUsageMatrix(
  graph: DependencyGraph
): Map<string, Map<string, number>> {
  const coUsageMatrix = new Map<string, Map<string, number>>();

  for (const [, node] of graph.nodes) {
    const imports = node.imports;

    for (let i = 0; i < imports.length; i++) {
      const fileA = imports[i];
      if (!coUsageMatrix.has(fileA)) coUsageMatrix.set(fileA, new Map());

      for (let j = i + 1; j < imports.length; j++) {
        const fileB = imports[j];
        const fileAUsage = coUsageMatrix.get(fileA)!;
        fileAUsage.set(fileB, (fileAUsage.get(fileB) || 0) + 1);

        if (!coUsageMatrix.has(fileB)) coUsageMatrix.set(fileB, new Map());
        const fileBUsage = coUsageMatrix.get(fileB)!;
        fileBUsage.set(fileA, (fileBUsage.get(fileA) || 0) + 1);
      }
    }
  }

  return coUsageMatrix;
}

/**
 * Extract type dependencies from AST exports
 * @param graph - The dependency graph to analyze
 * @returns Map of type references to files that use them
 */
export function buildTypeGraph(
  graph: DependencyGraph
): Map<string, Set<string>> {
  const typeGraph = new Map<string, Set<string>>();

  for (const [file, node] of graph.nodes) {
    for (const exp of node.exports) {
      if (exp.typeReferences) {
        for (const typeRef of exp.typeReferences) {
          if (!typeGraph.has(typeRef)) typeGraph.set(typeRef, new Set());
          typeGraph.get(typeRef)!.add(file);
        }
      }
    }
  }

  return typeGraph;
}

/**
 * Find semantic clusters using co-usage patterns
 * @param coUsageMatrix - The co-usage matrix from buildCoUsageMatrix
 * @param minCoUsage - Minimum co-usage count to consider (default: 3)
 * @returns Map of cluster representative files to their cluster members
 */
export function findSemanticClusters(
  coUsageMatrix: Map<string, Map<string, number>>,
  minCoUsage: number = 3
): Map<string, string[]> {
  const clusters = new Map<string, string[]>();
  const visited = new Set<string>();

  for (const [file, coUsages] of coUsageMatrix) {
    if (visited.has(file)) continue;

    const cluster: string[] = [file];
    visited.add(file);

    for (const [relatedFile, count] of coUsages) {
      if (count >= minCoUsage && !visited.has(relatedFile)) {
        cluster.push(relatedFile);
        visited.add(relatedFile);
      }
    }

    if (cluster.length > 1) clusters.set(file, cluster);
  }

  return clusters;
}

/**
 * Infer domain from semantic analysis (co-usage + types)
 */
export function inferDomainFromSemantics(
  file: string,
  exportName: string,
  graph: DependencyGraph,
  coUsageMatrix: Map<string, Map<string, number>>,
  typeGraph: Map<string, Set<string>>,
  exportTypeRefs?: string[]
): DomainAssignment[] {
  const domainSignals = new Map<string, DomainSignals>();

  const coUsages = coUsageMatrix.get(file) || new Map();
  const strongCoUsages = Array.from(coUsages.entries())
    .filter(([, count]) => count >= 3)
    .map(([coFile]) => coFile);

  for (const coFile of strongCoUsages) {
    const coNode = graph.nodes.get(coFile);
    if (coNode) {
      for (const exp of coNode.exports) {
        if (exp.inferredDomain && exp.inferredDomain !== 'unknown') {
          const domain = exp.inferredDomain;
          if (!domainSignals.has(domain)) {
            domainSignals.set(domain, {
              coUsage: false,
              typeReference: false,
              exportName: false,
              importPath: false,
              folderStructure: false,
            });
          }
          domainSignals.get(domain)!.coUsage = true;
        }
      }
    }
  }

  if (exportTypeRefs) {
    for (const typeRef of exportTypeRefs) {
      const filesWithType = typeGraph.get(typeRef);
      if (filesWithType) {
        for (const typeFile of filesWithType) {
          if (typeFile === file) continue;
          const typeNode = graph.nodes.get(typeFile);
          if (typeNode) {
            for (const exp of typeNode.exports) {
              if (exp.inferredDomain && exp.inferredDomain !== 'unknown') {
                const domain = exp.inferredDomain;
                if (!domainSignals.has(domain)) {
                  domainSignals.set(domain, {
                    coUsage: false,
                    typeReference: false,
                    exportName: false,
                    importPath: false,
                    folderStructure: false,
                  });
                }
                domainSignals.get(domain)!.typeReference = true;
              }
            }
          }
        }
      }
    }
  }

  const assignments: DomainAssignment[] = [];
  for (const [domain, signals] of domainSignals) {
    const confidence = calculateDomainConfidence(signals);
    if (confidence >= 0.3) assignments.push({ domain, confidence, signals });
  }

  assignments.sort((a, b) => b.confidence - a.confidence);
  return assignments;
}

export function calculateDomainConfidence(signals: DomainSignals): number {
  const weights = {
    coUsage: 0.35,
    typeReference: 0.3,
    exportName: 0.15,
    importPath: 0.1,
    folderStructure: 0.1,
  };
  let confidence = 0;
  if (signals.coUsage) confidence += weights.coUsage;
  if (signals.typeReference) confidence += weights.typeReference;
  if (signals.exportName) confidence += weights.exportName;
  if (signals.importPath) confidence += weights.importPath;
  if (signals.folderStructure) confidence += weights.folderStructure;
  return confidence;
}

/**
 * Regex-based export extraction (legacy/fallback)
 */
export function extractExports(
  content: string,
  filePath?: string,
  domainOptions?: { domainKeywords?: string[] },
  fileImports?: string[]
): ExportInfo[] {
  const exports: ExportInfo[] = [];
  const patterns = [
    /export\s+function\s+(\w+)/g,
    /export\s+class\s+(\w+)/g,
    /export\s+const\s+(\w+)/g,
    /export\s+type\s+(\w+)/g,
    /export\s+interface\s+(\w+)/g,
    /export\s+default/g,
  ];

  const types: ExportInfo['type'][] = [
    'function',
    'class',
    'const',
    'type',
    'interface',
    'default',
  ];

  patterns.forEach((pattern, index) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1] || 'default';
      const type = types[index];
      const inferredDomain = inferDomain(
        name,
        filePath,
        domainOptions,
        fileImports
      );
      exports.push({ name, type, inferredDomain });
    }
  });

  return exports;
}

/**
 * Infer domain from name, path, or imports
 */
export function inferDomain(
  name: string,
  filePath?: string,
  domainOptions?: { domainKeywords?: string[] },
  fileImports?: string[]
): string {
  const lower = name.toLowerCase();
  const tokens = Array.from(
    new Set(
      lower
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[^a-z0-9]+/gi, ' ')
        .split(' ')
        .filter(Boolean)
    )
  );

  const defaultKeywords = [
    'authentication',
    'authorization',
    'payment',
    'invoice',
    'customer',
    'product',
    'order',
    'cart',
    'user',
    'admin',
    'repository',
    'controller',
    'service',
    'config',
    'model',
    'view',
    'auth',
  ];

  const domainKeywords = domainOptions?.domainKeywords?.length
    ? [...domainOptions.domainKeywords, ...defaultKeywords]
    : defaultKeywords;

  for (const keyword of domainKeywords) {
    if (tokens.includes(keyword)) return keyword;
  }

  for (const keyword of domainKeywords) {
    if (lower.includes(keyword)) return keyword;
  }

  if (fileImports) {
    for (const importPath of fileImports) {
      const segments = importPath.split('/');
      for (const segment of segments) {
        const segLower = segment.toLowerCase();
        const singularSegment = singularize(segLower);
        for (const keyword of domainKeywords) {
          if (
            singularSegment === keyword ||
            segLower === keyword ||
            segLower.includes(keyword)
          )
            return keyword;
        }
      }
    }
  }

  if (filePath) {
    const segments = filePath.split('/');
    for (const segment of segments) {
      const segLower = segment.toLowerCase();
      const singularSegment = singularize(segLower);
      for (const keyword of domainKeywords) {
        if (singularSegment === keyword || segLower === keyword) return keyword;
      }
    }
  }

  return 'unknown';
}

export function getCoUsageData(
  file: string,
  coUsageMatrix: Map<string, Map<string, number>>
): CoUsageData {
  return {
    file,
    coImportedWith: coUsageMatrix.get(file) || new Map(),
    sharedImporters: [],
  };
}

export function findConsolidationCandidates(
  graph: DependencyGraph,
  coUsageMatrix: Map<string, Map<string, number>>,
  typeGraph: Map<string, Set<string>>,
  minCoUsage: number = 5,
  minSharedTypes: number = 2
) {
  const candidates: any[] = [];
  for (const [fileA, coUsages] of coUsageMatrix) {
    const nodeA = graph.nodes.get(fileA);
    if (!nodeA) continue;
    for (const [fileB, count] of coUsages) {
      if (fileB <= fileA || count < minCoUsage) continue;
      const nodeB = graph.nodes.get(fileB);
      if (!nodeB) continue;
      const typesA = new Set(
        nodeA.exports.flatMap((e) => e.typeReferences || [])
      );
      const typesB = new Set(
        nodeB.exports.flatMap((e) => e.typeReferences || [])
      );
      const sharedTypes = Array.from(typesA).filter((t) => typesB.has(t));
      if (sharedTypes.length >= minSharedTypes || count >= minCoUsage * 2) {
        candidates.push({
          files: [fileA, fileB],
          reason: `High co-usage (${count}x)`,
          strength: count / 10,
        });
      }
    }
  }
  return candidates.sort((a, b) => b.strength - a.strength);
}
