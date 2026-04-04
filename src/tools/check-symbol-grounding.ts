import { typescriptAdapter } from '../adapters/typescript-adapter.js';
import { projectManager } from '../project-manager.js';
import { SyntaxKind, Node } from 'ts-morph';
import { validateWorkspacePath } from '../security.js';

export interface GroundingScore {
  score: number;
  grade: string;
  breakdown: {
    documentation: number;
    typeClarity: number;
    depthImpact: number;
  };
  recommendations: string[];
}

export async function checkSymbolGrounding(
  symbol: string,
  filePath: string
): Promise<GroundingScore | undefined> {
  const safePath = validateWorkspacePath(filePath);
  const tsconfig = await projectManager.findNearestTsConfig(safePath);
  if (!tsconfig) return undefined;

  const project = projectManager.ensureProject(tsconfig);
  const sourceFile = project.addSourceFileAtPathIfExists(safePath);

  if (!sourceFile) return undefined;

  const node = sourceFile
    .getDescendantsOfKind(SyntaxKind.Identifier)
    .find((id: Node) => id.getText() === symbol);

  if (!node) return undefined;

  const decl = node.getSymbol()?.getDeclarations()?.[0];
  if (!decl) return undefined;

  let docScore = 0;
  let typeScore = 0;
  let depthScore = 30;
  const recommendations: string[] = [];

  // 1. Documentation Analysis
  const docs = typescriptAdapter.getSymbolDocs(decl as Node);
  if (docs) {
    docScore += 10;
    if (docs.documentation && docs.documentation.length > 20) docScore += 10;

    const hasParams = docs.tags.some((t) => t.name === 'param');
    const hasReturns = docs.tags.some(
      (t) => t.name === 'returns' || t.name === 'return'
    );

    if (hasParams) docScore += 10;
    else
      recommendations.push(
        'Add @param tags to document implementation details for the agent.'
      );

    if (hasReturns) docScore += 10;
    else
      recommendations.push('Add @returns tag to clarify output expectations.');
  } else {
    recommendations.push(
      'Missing JSDoc. Agents need explicit documentation to understand intent without reading the source.'
    );
  }

  // 2. Type Clarity Analysis
  const typeText = (decl as any).getType?.()?.getText?.() || '';
  if (typeText) {
    if (!typeText.includes('any')) typeScore += 15;
    else
      recommendations.push(
        'Avoid "any" types. They break agentic reasoning and cause hallucinations.'
      );

    if (!typeText.includes('unknown')) typeScore += 15;
    else
      recommendations.push(
        'Use specific interfaces instead of "unknown" to minimize agent probe requirements.'
      );
  }

  // 3. Depth Impact (Simulated for now based on imports in file)
  const importCount = sourceFile.getImportDeclarations().length;
  if (importCount > 10) {
    const penalty = Math.min(20, (importCount - 10) * 2);
    depthScore -= penalty;
    recommendations.push(
      `High dependency depth (${importCount} imports). Agents must load more files to understand this symbol's context.`
    );
  }

  const totalScore = docScore + typeScore + depthScore;
  let grade = 'F';
  if (totalScore >= 90) grade = 'S (Agent-Native)';
  else if (totalScore >= 80) grade = 'A (Highly Grounded)';
  else if (totalScore >= 70) grade = 'B (Good)';
  else if (totalScore >= 60) grade = 'C (Acceptable)';
  else if (totalScore >= 40) grade = 'D (Poor)';

  return {
    score: totalScore,
    grade,
    breakdown: {
      documentation: docScore,
      typeClarity: typeScore,
      depthImpact: depthScore,
    },
    recommendations,
  };
}
