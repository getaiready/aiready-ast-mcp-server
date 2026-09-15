const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export const TOOL_DEFINITIONS = [
  {
    name: 'resolve_definition',
    description: 'Find where a symbol is defined using TypeScript AST.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Symbol name (e.g., function, class)',
        },
        path: {
          type: 'string',
          description: 'Project root or target directory',
        },
      },
      required: ['symbol', 'path'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'find_references',
    description: 'Find all usages of a symbol across the project.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Symbol name' },
        path: { type: 'string', description: 'Project root' },
        limit: { type: 'number', default: 50 },
        offset: { type: 'number', default: 0 },
      },
      required: ['symbol', 'path'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'find_implementations',
    description: 'Find implementations of interfaces or abstract classes.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Interface/Class name' },
        path: { type: 'string', description: 'Project root' },
        limit: { type: 'number', default: 50 },
        offset: { type: 'number', default: 0 },
      },
      required: ['symbol', 'path'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'get_file_structure',
    description:
      'Get structural overview of a file (imports, exports, symbols).',
    inputSchema: {
      type: 'object',
      properties: {
        file: { type: 'string', description: 'Absolute path to file' },
      },
      required: ['file'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'grep_search',
    description:
      'Fast, context-aware text search via ripgrep. Supports context lines and result summarization.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Search pattern' },
        path: { type: 'string', description: 'Directory to search' },
        include: {
          type: 'array',
          items: { type: 'string' },
          description: 'Glob filter',
        },
        exclude: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exclusion filter',
        },
        limit: { type: 'number', default: 50 },
        offset: { type: 'number', default: 0 },
        context: { type: 'number', default: 2 },
        isRegex: { type: 'boolean', default: true },
      },
      required: ['pattern', 'path'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'search_code',
    description:
      'Fast regex search via bundled ripgrep (alias for grep_search).',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Search pattern' },
        path: { type: 'string', description: 'Directory to search' },
        filePattern: { type: 'string', description: 'Glob filter' },
        limit: { type: 'number', default: 50 },
        offset: { type: 'number', default: 0 },
        regex: { type: 'boolean', default: true },
      },
      required: ['pattern', 'path'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'get_symbol_docs',
    description: 'Get JSDoc/TSDoc for a specific symbol.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: 'Symbol name' },
        path: { type: 'string', description: 'Project root' },
      },
      required: ['symbol', 'path'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'build_symbol_index',
    description: 'Warm the symbol index for faster navigation.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Project root to index' },
      },
      required: ['path'],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: 'get_call_hierarchy',
    description: 'Find callers and callees for a symbol.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        path: { type: 'string' },
        direction: {
          type: 'string',
          enum: ['incoming', 'outgoing'],
          default: 'outgoing',
        },
      },
      required: ['symbol', 'path'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'check_symbol_grounding',
    description:
      "Assess a symbol's AI grounding quality (docs, type clarity, depth).",
    inputSchema: {
      type: 'object',
      properties: {
        symbol: { type: 'string' },
        path: { type: 'string' },
      },
      required: ['symbol', 'path'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'hygiene_audit',
    description:
      'Performs a codebase-level hygiene check for technical debt (TODOs) and waste (empty dirs, orphans).',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Project root directory to audit',
        },
      },
      required: ['path'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'metabolism_audit',
    description: 'Alias for hygiene_audit (Serverless Claw compat).',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
  {
    name: 'codebase_audit',
    description: 'Alias for hygiene_audit.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
    annotations: READ_ONLY_ANNOTATIONS,
  },
] as const;
