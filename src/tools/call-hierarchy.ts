import { projectManager } from '../project-manager.js';
import { validateWorkspacePath } from '../security.js';
import { Node, SyntaxKind } from 'ts-morph';

export async function getCallHierarchy(
  symbolName: string,
  rootDir: string,
  direction: 'incoming' | 'outgoing' | 'both' = 'both'
) {
  const safeRoot = validateWorkspacePath(rootDir);
  const configs = await projectManager.getProjectsForPath(safeRoot);

  const results: {
    symbol: string;
    incoming: Array<{ name: string; file: string; line: number }>;
    outgoing: Array<{ name: string; file: string; line: number }>;
  } = {
    symbol: symbolName,
    incoming: [],
    outgoing: [],
  };

  for (const config of configs) {
    const project = projectManager.ensureProject(config);
    project.addSourceFilesFromTsConfig(config);

    // Find the symbol definition
    const sourceFiles = project.getSourceFiles();
    let targetNode: Node | undefined;

    for (const file of sourceFiles) {
      const decls = file.getExportedDeclarations().get(symbolName) || [];
      if (decls.length > 0) {
        targetNode = decls[0] as Node;
        break;
      }

      // Also look for non-exported ones
      const fn = file.getFunction(symbolName);
      if (fn) {
        targetNode = fn;
        break;
      }

      const cls = file.getClass(symbolName);
      if (cls) {
        targetNode = cls;
        break;
      }
    }

    if (!targetNode) continue;

    // Incoming calls (references)
    if (direction === 'incoming' || direction === 'both') {
      const referencedSymbols = (targetNode as any).findReferences?.() || [];
      for (const referencedSymbol of referencedSymbols) {
        for (const reference of referencedSymbol.getReferences()) {
          const sourceFile = reference.getSourceFile();
          const fileName = sourceFile.getFilePath();
          const line = reference.getNode().getStartLineNumber();

          const caller =
            reference
              .getNode()
              .getFirstAncestorByKind(SyntaxKind.FunctionDeclaration) ||
            reference
              .getNode()
              .getFirstAncestorByKind(SyntaxKind.MethodDeclaration) ||
            reference
              .getNode()
              .getFirstAncestorByKind(SyntaxKind.ClassDeclaration);

          results.incoming.push({
            name: (caller as any)?.getName?.() || 'anonymous',
            file: fileName,
            line: line,
          });
        }
      }
    }

    // Outgoing calls
    if (direction === 'outgoing' || direction === 'both') {
      const calls = targetNode.getDescendantsOfKind(SyntaxKind.CallExpression);
      for (const call of calls) {
        const expression = call.getExpression();
        const symbol = (call as any).getReturnType?.()
          ? (call as any).getExpression().getSymbol()
          : undefined;

        results.outgoing.push({
          name: symbol?.getName() || expression.getText(),
          file: call.getSourceFile().getFilePath(),
          line: call.getStartLineNumber(),
        });
      }
    }
  }

  // Deduplicate results safely
  const uniqueIncoming = new Map<string, any>();
  for (const item of results.incoming) {
    uniqueIncoming.set(`${item.file}:${item.line}`, item);
  }
  results.incoming = Array.from(uniqueIncoming.values());

  const uniqueOutgoing = new Map<string, any>();
  for (const item of results.outgoing) {
    uniqueOutgoing.set(`${item.file}:${item.line}:${item.name}`, item);
  }
  results.outgoing = Array.from(uniqueOutgoing.values());

  return results;
}
