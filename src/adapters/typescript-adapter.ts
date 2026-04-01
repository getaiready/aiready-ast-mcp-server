import {
  Project,
  SourceFile,
  Node,
  Symbol,
  JSDoc,
  Type,
  SyntaxKind,
} from 'ts-morph';
import fs from 'fs';
import {
  DefinitionLocation,
  ReferenceLocation,
  FileStructure,
  SymbolKind,
  ImportInfo,
  ExportInfo,
  ClassInfo,
  FunctionInfo,
  InterfaceInfo,
  TypeAliasInfo,
  EnumInfo,
  JSDocTag,
} from '../types.js';
import { projectManager } from '../project-manager.js';
import { symbolIndex } from '../index/symbol-index.js';
import { validateWorkspacePath } from '../security.js';

export class TypeScriptAdapter {
  public async resolveDefinition(
    symbolName: string,
    path: string
  ): Promise<DefinitionLocation[]> {
    const safePath = validateWorkspacePath(path);

    // Fast path: index lookup (O(1)) to find the file
    const indexHits = symbolIndex.lookup(symbolName);
    if (indexHits.length > 0) {
      const results: DefinitionLocation[] = [];
      for (const hit of indexHits) {
        const tsconfig = await projectManager.findNearestTsConfig(hit.file);
        if (tsconfig) {
          const project = projectManager.ensureProject(tsconfig);
          const sourceFile = project.addSourceFileAtPathIfExists(hit.file);
          if (sourceFile) {
            const exported = sourceFile
              .getExportedDeclarations()
              .get(symbolName);
            if (exported && exported.length > 0) {
              results.push(this.mapToDefinitionLocation(exported[0] as Node));
              continue;
            }
          }
        }
        // Fallback if ts-morph loading fails for the hit
        results.push({
          file: hit.file,
          line: hit.line,
          column: hit.column,
          kind: hit.kind,
          snippet: '',
          documentation: undefined,
        });
      }
      return results;
    }

    // Fallback: search specific file via ts-morph (useful for local files without full index)
    if (fs.statSync(safePath).isDirectory()) {
      return []; // Cannot load a directory as a single file
    }

    const tsconfig = await projectManager.findNearestTsConfig(safePath);
    if (!tsconfig) return [];

    const project = projectManager.ensureProject(tsconfig);
    const sourceFile = project.addSourceFileAtPathIfExists(safePath);
    if (!sourceFile) return [];

    const exported = sourceFile.getExportedDeclarations().get(symbolName);
    if (!exported) return [];

    return exported.map((decl) => this.mapToDefinitionLocation(decl as Node));
  }

  public async findReferences(
    symbolName: string,
    path: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ references: ReferenceLocation[]; total_count: number }> {
    const safePath = validateWorkspacePath(path);

    // Index lookup to find definition location
    const hits = symbolIndex.lookup(symbolName);
    if (hits.length === 0) return { references: [], total_count: 0 };

    // Load only the definition file
    const hit = hits[0];
    const tsconfig = await projectManager.findNearestTsConfig(hit.file);
    if (!tsconfig) return { references: [], total_count: 0 };

    const project = projectManager.ensureProject(tsconfig);
    const sourceFile = project.addSourceFileAtPathIfExists(hit.file);
    if (!sourceFile) return { references: [], total_count: 0 };

    // Find the node at the definition position
    const node = sourceFile.getDescendantAtPos(
      sourceFile.getLineAndColumnAtPos(hit.column).line // Wait, ts-morph getDescendantAtPos takes an absolute pos. hit.column is line pos? No, wait.
    );

    // We need the actual node. Instead of calculating position from line/col, let's just find the exported declaration.
    const exported = sourceFile.getExportedDeclarations().get(symbolName);
    if (!exported || exported.length === 0)
      return { references: [], total_count: 0 };

    const targetNode = exported[0];

    // Hybrid approach: to prevent OOM, we don't load all files in the project.
    // Instead, we use rg to find files that literally contain the symbol name,
    // and only load those into ts-morph for accurate reference resolution.
    try {
      const { searchCode } = await import('../tools/search-code.js');
      const searchResults = await searchCode(
        symbolName,
        path,
        '*.{ts,tsx,js,jsx}',
        1000,
        false
      );
      const filesToLoad = [...new Set(searchResults.map((r) => r.file))];
      console.log('Search code files to load:', filesToLoad);
      for (const file of filesToLoad) {
        project.addSourceFileAtPathIfExists(file);
      }
    } catch (e) {
      console.error('Search code failed:', e);
    }

    const refSymbols = (targetNode as any).findReferences?.();
    if (!refSymbols) return { references: [], total_count: 0 };

    const results: ReferenceLocation[] = [];
    for (const refSymbol of refSymbols) {
      for (const ref of refSymbol.getReferences()) {
        const sf = ref.getSourceFile();
        const lc = sf.getLineAndColumnAtPos(ref.getTextSpan().getStart());
        results.push({
          file: sf.getFilePath(),
          line: lc.line,
          column: lc.column,
          text: ref.getNode().getParent()?.getText() || ref.getNode().getText(),
        });
      }
    }

    const unique = this.deduplicateLocations(results);
    return {
      references: unique.slice(offset, offset + limit),
      total_count: unique.length,
    };
  }

  public async findImplementations(
    symbolName: string,
    path: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ implementations: ReferenceLocation[]; total_count: number }> {
    const safePath = validateWorkspacePath(path);
    const hits = symbolIndex.lookup(symbolName);
    if (hits.length === 0) return { implementations: [], total_count: 0 };

    const hit = hits[0];
    const tsconfig = await projectManager.findNearestTsConfig(hit.file);
    if (!tsconfig) return { implementations: [], total_count: 0 };

    const project = projectManager.ensureProject(tsconfig);
    const sourceFile = project.addSourceFileAtPathIfExists(hit.file);
    if (!sourceFile) return { implementations: [], total_count: 0 };

    const exported = sourceFile.getExportedDeclarations().get(symbolName);
    if (!exported || exported.length === 0)
      return { implementations: [], total_count: 0 };

    const targetNode = exported[0];
    if (
      !Node.isClassDeclaration(targetNode) &&
      !Node.isInterfaceDeclaration(targetNode)
    ) {
      return { implementations: [], total_count: 0 };
    }

    try {
      const { searchCode } = await import('../tools/search-code.js');
      const searchResults = await searchCode(
        symbolName,
        path,
        '*.{ts,tsx,js,jsx}',
        1000,
        false
      );
      const filesToLoad = [...new Set(searchResults.map((r) => r.file))];
      for (const file of filesToLoad) {
        project.addSourceFileAtPathIfExists(file);
      }
    } catch (e) {}

    const results: ReferenceLocation[] = [];
    const implementations = (targetNode as any).getImplementations?.();
    if (implementations) {
      for (const impl of implementations) {
        const sf = impl.getSourceFile();
        const lc = sf.getLineAndColumnAtPos(impl.getTextSpan().getStart());
        results.push({
          file: sf.getFilePath(),
          line: lc.line,
          column: lc.column,
          text:
            impl.getNode().getParent()?.getText() || impl.getNode().getText(),
        });
      }
    }

    const unique = this.deduplicateLocations(results);
    return {
      implementations: unique.slice(offset, offset + limit),
      total_count: unique.length,
    };
  }

  public async getFileStructure(
    filePath: string
  ): Promise<FileStructure | undefined> {
    const safePath = validateWorkspacePath(filePath);
    const tsconfig = await projectManager.findNearestTsConfig(safePath);
    if (!tsconfig) return undefined;

    const project = projectManager.ensureProject(tsconfig);
    const sourceFile = project.addSourceFileAtPathIfExists(safePath);
    if (!sourceFile) return undefined;

    const structure: FileStructure = {
      file: safePath,
      imports: sourceFile.getImportDeclarations().map((imp: any) => ({
        module: imp.getModuleSpecifierValue(),
        names: imp.getNamedImports().map((ni: any) => ni.getName()),
      })),
      exports: sourceFile.getExportSymbols().map((sym: Symbol) => ({
        name: sym.getName(),
        kind: this.mapSymbolKind(sym),
      })),
      classes: sourceFile
        .getClasses()
        .map((cls: any) => this.mapToClassInfo(cls)),
      functions: sourceFile
        .getFunctions()
        .map((fn: any) => this.mapToFunctionInfo(fn)),
      interfaces: sourceFile
        .getInterfaces()
        .map((itf: any) => this.mapToInterfaceInfo(itf)),
      typeAliases: sourceFile
        .getTypeAliases()
        .map((ta: any) => this.mapToTypeAliasInfo(ta)),
      enums: sourceFile.getEnums().map((enm: any) => this.mapToEnumInfo(enm)),
    };

    return structure;
  }

  private mapToDefinitionLocation(node: Node): DefinitionLocation {
    const sourceFile = node.getSourceFile();
    const lineAndColumn = sourceFile.getLineAndColumnAtPos(node.getStart());

    return {
      file: sourceFile.getFilePath(),
      line: lineAndColumn.line,
      column: lineAndColumn.column,
      kind: this.mapNodeToSymbolKind(node),
      snippet: node.getText(),
      documentation: this.getJsDoc(node),
    };
  }

  private mapNodeToSymbolKind(node: Node): SymbolKind {
    if (Node.isClassDeclaration(node)) return 'class';
    if (Node.isFunctionDeclaration(node)) return 'function';
    if (Node.isInterfaceDeclaration(node)) return 'interface';
    if (Node.isTypeAliasDeclaration(node)) return 'type_alias';
    if (Node.isEnumDeclaration(node)) return 'enum';
    if (Node.isVariableDeclaration(node)) return 'variable';
    if (Node.isMethodDeclaration(node)) return 'method';
    if (Node.isPropertyDeclaration(node)) return 'property';
    if (Node.isParameterDeclaration(node)) return 'parameter';
    return 'variable';
  }

  private mapSymbolKind(symbol: Symbol): SymbolKind {
    const decls = symbol.getDeclarations();
    if (decls.length > 0) return this.mapNodeToSymbolKind(decls[0]);
    return 'variable';
  }

  private getJsDoc(node: Node): string | undefined {
    if (Node.isJSDocable(node)) {
      const docs = node.getJsDocs();
      if (docs.length > 0) {
        return docs[0].getCommentText();
      }
    }
    return undefined;
  }

  public getSymbolDocs(node: Node) {
    if (Node.isJSDocable(node)) {
      const docs = node.getJsDocs();
      if (docs.length > 0) {
        const doc = docs[0];
        return {
          documentation: doc.getCommentText(),
          tags: doc.getTags().map((tag) => ({
            name: tag.getTagName(),
            text: tag.getCommentText() || '',
          })),
        };
      }
    }
    return undefined;
  }

  private mapToClassInfo(cls: any): ClassInfo {
    return {
      name: cls.getName() || 'anonymous',
      ...this.getSymbolDocs(cls),
      methods: cls.getMethods().map((m: any) => this.mapToFunctionInfo(m)),
      properties: cls
        .getProperties()
        .map((p: any) => this.mapToPropertyInfo(p)),
    };
  }

  private mapToFunctionInfo(fn: any): FunctionInfo {
    return {
      name: fn.getName() || 'anonymous',
      ...this.getSymbolDocs(fn),
      params: fn.getParameters().map((p: any) => ({
        name: p.getName(),
        type: p.getType().getText(),
      })),
      returnType: fn.getReturnType().getText(),
    };
  }

  private mapToPropertyInfo(p: any) {
    return {
      name: p.getName(),
      type: p.getType().getText(),
      ...this.getSymbolDocs(p),
    };
  }

  private mapToInterfaceInfo(itf: any): InterfaceInfo {
    return {
      name: itf.getName(),
      ...this.getSymbolDocs(itf),
      properties: itf
        .getProperties()
        .map((p: any) => this.mapToPropertyInfo(p)),
      methods: itf.getMethods().map((m: any) => this.mapToFunctionInfo(m)),
    };
  }

  private mapToTypeAliasInfo(ta: any): TypeAliasInfo {
    return {
      name: ta.getName(),
      type: ta.getType().getText(),
      ...this.getSymbolDocs(ta),
    };
  }

  private mapToEnumInfo(enm: any): EnumInfo {
    return {
      name: enm.getName(),
      ...this.getSymbolDocs(enm),
      members: enm.getMembers().map((m: any) => m.getName()),
    };
  }

  private deduplicateLocations<
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
}

export const typescriptAdapter = new TypeScriptAdapter();
