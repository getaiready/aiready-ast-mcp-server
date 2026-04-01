import { typescriptAdapter } from '../adapters/typescript-adapter.js';
import { projectManager } from '../project-manager.js';
import { SyntaxKind, Node } from 'ts-morph';
import { validateWorkspacePath } from '../security.js';

export async function getSymbolDocs(
  symbol: string,
  filePath: string
): Promise<any> {
  const safePath = validateWorkspacePath(filePath);
  const tsconfig = await projectManager.findNearestTsConfig(safePath);
  if (!tsconfig) return undefined;

  const project = projectManager.ensureProject(tsconfig);
  const sourceFile = project.addSourceFileAtPathIfExists(safePath);

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

  return undefined;
}
