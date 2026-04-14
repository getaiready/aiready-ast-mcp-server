import { z } from 'zod';

/**
 * Tool 1: resolve_definition
 */
export const ResolveDefinitionSchema = z.object({
  symbol: z
    .string()
    .describe(
      'Symbol name to resolve (function, class, type, interface, etc.)'
    ),
  path: z.string().describe('Project root or target directory'),
});

/**
 * Tool 2: find_references
 */
export const FindReferencesSchema = z.object({
  symbol: z.string().describe('Symbol name to find references for'),
  path: z.string().describe('Project root directory'),
  limit: z
    .number()
    .optional()
    .default(50)
    .describe('Max results per page (default 50)'),
  offset: z.number().optional().default(0).describe('Pagination offset'),
});

/**
 * Tool 3: find_implementations
 */
export const FindImplementationsSchema = z.object({
  symbol: z
    .string()
    .describe('Interface or abstract class name to find implementations for'),
  path: z.string().describe('Project root directory'),
  limit: z.number().optional().default(50).describe('Max results per page'),
  offset: z.number().optional().default(0).describe('Pagination offset'),
});

/**
 * Tool 4: get_file_structure
 */
export const GetFileStructureSchema = z.object({
  file: z.string().describe('Absolute path to the file to analyze'),
});

/**
 * Tool 5: grep_search
 */
export const GrepSearchSchema = z.object({
  pattern: z.string().describe('Search pattern (regex by default)'),
  path: z.string().describe('Directory to search in'),
  include: z
    .array(z.string())
    .optional()
    .describe('Include only these glob patterns (e.g., ["*.ts", "src/**"])'),
  exclude: z
    .array(z.string())
    .optional()
    .describe('Exclude these glob patterns (e.g., ["**/*.test.ts"])'),
  limit: z
    .number()
    .optional()
    .default(50)
    .describe('Max matches to return (default 50)'),
  offset: z
    .number()
    .optional()
    .default(0)
    .describe('Pagination offset (default 0)'),
  context: z
    .number()
    .optional()
    .default(2)
    .describe('Number of context lines before and after (default 2)'),
  isRegex: z
    .boolean()
    .optional()
    .default(true)
    .describe('Use regex mode (default true)'),
});

/**
 * Tool 6: search_code (legacy alias for grep_search)
 */
export const SearchCodeSchema = z.object({
  pattern: z.string().describe('Search pattern (regex by default)'),
  path: z.string().describe('Directory to search in'),
  filePattern: z.string().optional().describe('Glob filter (e.g., "*.ts")'),
  limit: z
    .number()
    .optional()
    .default(50)
    .describe('Max matches to return (default 50)'),
  offset: z
    .number()
    .optional()
    .default(0)
    .describe('Pagination offset (default 0)'),
  regex: z
    .boolean()
    .optional()
    .default(true)
    .describe('Use regex mode (default true)'),
});

/**
 * Tool 6: get_symbol_docs
 */
export const GetSymbolDocsSchema = z.object({
  symbol: z.string().describe('Symbol name to get documentation for'),
  path: z.string().describe('Project root directory'),
});

/**
 * Tool 7: build_symbol_index
 */
export const BuildSymbolIndexSchema = z.object({
  path: z.string().describe('Project root directory to index'),
});
/**
 * Tool 8: get_call_hierarchy
 */
export const GetCallHierarchySchema = z.object({
  symbol: z.string().describe('Symbol name to find callers/callees for'),
  path: z.string().describe('Project root directory'),
  direction: z
    .enum(['incoming', 'outgoing', 'both'])
    .optional()
    .default('both')
    .describe('Direction of calls (default: both)'),
});
/**
 * Tool 9: check_symbol_grounding
 */
export const CheckSymbolGroundingSchema = z.object({
  symbol: z.string().describe('Symbol name to assess grounding for'),
  path: z.string().describe('Project root directory'),
});

/**
 * Tool 10: codebase_audit
 */
export const CodebaseAuditSchema = z.object({
  path: z
    .string()
    .describe('Project root directory to audit for debt and bloat'),
});
