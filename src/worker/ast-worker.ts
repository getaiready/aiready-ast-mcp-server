import { parentPort } from 'worker_threads';
import { Project } from 'ts-morph';

const projects = new Map<string, Project>();

function getProject(tsconfigPath: string): Project {
  if (!projects.has(tsconfigPath)) {
    projects.set(
      tsconfigPath,
      new Project({
        tsConfigFilePath: tsconfigPath,
        skipAddingFilesFromTsConfig: true,
      })
    );
  }
  return projects.get(tsconfigPath)!;
}

interface WorkerMessage {
  id: string;
  type: string;
  payload: any;
}

interface ReferenceLocation {
  file: string;
  line: number;
  column: number;
  text: string;
}

parentPort?.on('message', async (msg: WorkerMessage) => {
  try {
    let result: unknown;

    switch (msg.type) {
      case 'resolve_definition': {
        const { tsconfig, file, symbol } = msg.payload;
        const project = getProject(tsconfig);
        const sf = project.addSourceFileAtPath(file);
        if (!sf) {
          result = [];
          break;
        }

        const exported = sf.getExportedDeclarations().get(symbol);
        if (!exported || exported.length === 0) {
          result = [];
          break;
        }

        result = exported.map((decl) => {
          const sourceFile = decl.getSourceFile();
          const lineAndColumn = sourceFile.getLineAndColumnAtPos(
            decl.getStart()
          );
          return {
            file: sourceFile.getFilePath(),
            line: lineAndColumn.line,
            column: lineAndColumn.column,
            kind: decl.getKindName(),
            snippet: decl.getText(),
            documentation: getJsDoc(decl),
          };
        });
        break;
      }

      case 'find_references': {
        const { tsconfig, file, symbol } = msg.payload;
        const project = getProject(tsconfig);
        const sf = project.addSourceFileAtPath(file);
        if (!sf) {
          result = { references: [], total_count: 0 };
          break;
        }

        const exported = sf.getExportedDeclarations().get(symbol);
        if (!exported || exported.length === 0) {
          result = { references: [], total_count: 0 };
          break;
        }

        const targetNode = exported[0];
        const refSymbols =
          'findReferences' in targetNode &&
          typeof (targetNode as { findReferences?: () => unknown[] })
            .findReferences === 'function'
            ? (
                targetNode as { findReferences: () => unknown[] }
              ).findReferences()
            : undefined;
        if (!refSymbols) {
          result = { references: [], total_count: 0 };
          break;
        }

        const results: ReferenceLocation[] = [];
        for (const refSymbol of refSymbols) {
          for (const ref of refSymbol.getReferences()) {
            const refSf = ref.getSourceFile();
            const lc = refSf.getLineAndColumnAtPos(
              ref.getTextSpan().getStart()
            );
            results.push({
              file: refSf.getFilePath(),
              line: lc.line,
              column: lc.column,
              text:
                ref.getNode().getParent()?.getText() || ref.getNode().getText(),
            });
          }
        }

        const unique = deduplicateLocations(results);
        result = {
          references: unique.slice(0, 50),
          total_count: unique.length,
        };
        break;
      }

      case 'find_implementations': {
        const { tsconfig, file, symbol } = msg.payload;
        const project = getProject(tsconfig);
        const sf = project.addSourceFileAtPath(file);
        if (!sf) {
          result = { implementations: [], total_count: 0 };
          break;
        }

        const exported = sf.getExportedDeclarations().get(symbol);
        if (!exported || exported.length === 0) {
          result = { implementations: [], total_count: 0 };
          break;
        }

        const targetNode = exported[0];
        const implementations =
          'getImplementations' in targetNode &&
          typeof (targetNode as { getImplementations?: () => unknown[] })
            .getImplementations === 'function'
            ? (
                targetNode as { getImplementations: () => unknown[] }
              ).getImplementations()
            : undefined;
        if (!implementations) {
          result = { implementations: [], total_count: 0 };
          break;
        }

        const results: ReferenceLocation[] = [];
        for (const impl of implementations) {
          const implSf = impl.getSourceFile();
          const lc = implSf.getLineAndColumnAtPos(
            impl.getTextSpan().getStart()
          );
          results.push({
            file: implSf.getFilePath(),
            line: lc.line,
            column: lc.column,
            text:
              impl.getNode().getParent()?.getText() || impl.getNode().getText(),
          });
        }

        const unique = deduplicateLocations(results);
        result = {
          implementations: unique.slice(0, 50),
          total_count: unique.length,
        };
        break;
      }

      default:
        throw new Error(`Unknown task type: ${msg.type}`);
    }

    parentPort?.postMessage({ id: msg.id, result });
  } catch (error: any) {
    parentPort?.postMessage({ id: msg.id, error: error.message });
  }
});

function getJsDoc(node: any): string | undefined {
  if (node.getJsDocs) {
    const docs = node.getJsDocs();
    if (docs.length > 0) {
      return docs[0].getCommentText();
    }
  }
  return undefined;
}

function deduplicateLocations<
  T extends { file: string; line: number; column: number },
>(locations: T[]): T[] {
  const seen = new Set<string>();
  return locations.filter((loc) => {
    const key = `${loc.file}:${loc.line}:${loc.column}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
