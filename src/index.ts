import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  ResolveDefinitionSchema,
  FindReferencesSchema,
  FindImplementationsSchema,
  GetFileStructureSchema,
  SearchCodeSchema,
  GrepSearchSchema,
  GetSymbolDocsSchema,
  BuildSymbolIndexSchema,
  GetCallHierarchySchema,
  CheckSymbolGroundingSchema,
  CodebaseAuditSchema,
} from './schemas.js';
import { resolveDefinition } from './tools/resolve-definition.js';
import { findReferences } from './tools/find-references.js';
import { findImplementations } from './tools/find-implementations.js';
import { getFileStructure } from './tools/get-file-structure.js';
import { grepSearch } from '@aiready/core';
import { getSymbolDocs } from './tools/get-symbol-docs.js';
import { buildSymbolIndex } from './tools/build-symbol-index.js';
import { getCallHierarchy } from './tools/call-hierarchy.js';
import { checkSymbolGrounding } from './tools/check-symbol-grounding.js';
import { symbolIndex } from './index/symbol-index.js';
import {
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DEFINITIONS } from './tool-definitions.js';

/**
 * AST-aware Code Exploration MCP Server
 */
export class ASTExplorerServer {
  private server: Server;
  private version: string = '0.1.0';

  constructor() {
    this.server = new Server(
      {
        name: 'ast-explorer-server',
        version: this.version,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();

    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };
  }

  private setupHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'ast://file/symbols',
            name: 'File Symbol List',
            description: 'Get all symbols defined in a file.',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Read resource content
    this.server.setRequestHandler(
      ReadResourceRequestSchema,
      async (request) => {
        const { uri } = request.params;
        const url = new URL(uri);

        if (url.protocol === 'ast:' && url.pathname === '//file/symbols') {
          const filePath = url.searchParams.get('path');
          if (!filePath) throw new Error('Missing "path" parameter in URI');

          const symbols = symbolIndex.lookupByFile(filePath);
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: JSON.stringify(symbols, null, 2),
              },
            ],
          };
        }

        throw new Error(`Resource not found: ${uri}`);
      }
    );

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools: TOOL_DEFINITIONS };
    });

    // Tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'resolve_definition': {
            const { symbol, path } = ResolveDefinitionSchema.parse(args);
            const results = await resolveDefinition(symbol, path);
            return {
              content: [
                { type: 'text', text: JSON.stringify(results, null, 2) },
              ],
            };
          }
          case 'find_references': {
            const { symbol, path, limit, offset } =
              FindReferencesSchema.parse(args);
            const results = await findReferences(symbol, path, limit, offset);
            return {
              content: [
                { type: 'text', text: JSON.stringify(results, null, 2) },
              ],
            };
          }
          case 'find_implementations': {
            const { symbol, path, limit, offset } =
              FindImplementationsSchema.parse(args);
            const results = await findImplementations(
              symbol,
              path,
              limit,
              offset
            );
            return {
              content: [
                { type: 'text', text: JSON.stringify(results, null, 2) },
              ],
            };
          }
          case 'get_file_structure': {
            const { file } = GetFileStructureSchema.parse(args);
            const structure = await getFileStructure(file);
            return {
              content: [
                { type: 'text', text: JSON.stringify(structure, null, 2) },
              ],
            };
          }
          case 'grep_search': {
            const {
              pattern,
              path,
              include,
              exclude,
              limit,
              offset,
              context,
              isRegex,
            } = GrepSearchSchema.parse(args);
            const result = await grepSearch({
              pattern,
              path,
              include,
              exclude,
              limit,
              offset,
              context,
              isRegex,
            });
            return {
              content: [
                { type: 'text', text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          case 'search_code': {
            const { pattern, path, filePattern, limit, offset, regex } =
              SearchCodeSchema.parse(args);
            const result = await grepSearch({
              pattern,
              path,
              include: filePattern ? [filePattern] : [],
              limit,
              offset,
              isRegex: regex,
              context: 0,
            });
            return {
              content: [
                { type: 'text', text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          case 'get_symbol_docs': {
            const { symbol, path } = GetSymbolDocsSchema.parse(args);
            const docs = await getSymbolDocs(symbol, path);
            return {
              content: [{ type: 'text', text: JSON.stringify(docs, null, 2) }],
            };
          }
          case 'build_symbol_index': {
            const { path } = BuildSymbolIndexSchema.parse(args);
            const stats = await buildSymbolIndex(path);
            return {
              content: [{ type: 'text', text: JSON.stringify(stats, null, 2) }],
            };
          }
          case 'get_call_hierarchy': {
            const { symbol, path, direction } =
              GetCallHierarchySchema.parse(args);
            const hierarchy = await getCallHierarchy(symbol, path, direction);
            return {
              content: [
                { type: 'text', text: JSON.stringify(hierarchy, null, 2) },
              ],
            };
          }
          case 'check_symbol_grounding': {
            const { symbol, path } = CheckSymbolGroundingSchema.parse(args);
            const result = await checkSymbolGrounding(symbol, path);
            return {
              content: [
                { type: 'text', text: JSON.stringify(result, null, 2) },
              ],
            };
          }
          case 'hygiene_audit':
          case 'metabolism_audit':
          case 'codebase_audit': {
            const { path: rootDir } = CodebaseAuditSchema.parse(args);
            // Dynamic import of the new hygiene-audit package logic
            const { HygieneAuditProvider } =
              await import('@aiready/hygiene-audit');
            const provider = new HygieneAuditProvider();
            const result = await provider.analyze({ rootDir });

            // Map ScanResult back to the flat structure serverlessclaw expects in metadata
            const allIssues = result.results.flatMap((r) => r.issues);
            const metadata = {
              debtMarkers: result.metadata?.debtMarkers || 0,
              emptyDirs: result.metadata?.emptyDirs || [],
              orphanedFiles: result.metadata?.orphanedFiles || [],
              findings: allIssues.map((i: any) => ({
                expected: i.recommendation || i.suggestion || '',
                actual: i.message,
                severity:
                  i.severity === 'critical'
                    ? 'P0'
                    : i.severity === 'major'
                      ? 'P1'
                      : 'P2',
                recommendation: i.recommendation || i.suggestion || '',
              })),
            };

            return {
              content: [
                { type: 'text', text: JSON.stringify(result, null, 2) },
              ],
              metadata,
            };
          }
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('AST Explorer MCP Server started');
  }
}

// Start the server
const server = new ASTExplorerServer();
server.run().catch((error) => {
  console.error('Fatal error starting AST Explorer MCP Server:', error);
  process.exit(1);
});
