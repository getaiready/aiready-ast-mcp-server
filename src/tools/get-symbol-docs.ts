import { typescriptAdapter } from '../adapters/typescript-adapter.js';
import { projectManager } from '../project-manager.js';
import { SyntaxKind, Node } from 'ts-morph';

export async function getSymbolDocs(
  symbol: string,
  filePath: string
): Promise<any> {
  const projects = await projectManager.getProjectsForPath(filePath);

  for (const project of projects) {
    const sourceFile = project.getSourceFile(filePath);
    if (sourceFile) {
      const node = sourceFile
        .getDescendantsOfKind(SyntaxKind.Identifier)
        .find((id: Node) => id.getText() === symbol);

      if (node) {
        const decls = node.getSymbol()?.getDeclarations();
        if (decls && decls.length > 0) {
          const docs = typescriptAdapter.getSymbolDocs(decls[0]);
          if (docs) {
            return {
              symbol,
              file: sourceFile.getFilePath(),
              line: sourceFile.getLineAndColumnAtPos(decls[0].getStart()).line,
              ...docs,
            };
          }
        }
      }
    }
  }

  return undefined;
}
