import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildSymbolIndex } from '../tools/build-symbol-index.js';
import { SymbolIndex, type DiskCache } from '../index/symbol-index.js';

const {
  buildIndexMock,
  getProjectsForPathMock,
  ensureProjectMock,
  validateWorkspacePathMock,
  existsSyncMock,
  statSyncMock,
  readFileSyncMock,
  writeFileSyncMock,
  mkdirSyncMock,
  createHashMock,
} = vi.hoisted(() => ({
  buildIndexMock: vi.fn(),
  getProjectsForPathMock: vi.fn(),
  ensureProjectMock: vi.fn(),
  validateWorkspacePathMock: vi.fn((p: string) => `/safe${p}`),
  existsSyncMock: vi.fn(),
  statSyncMock: vi.fn(),
  readFileSyncMock: vi.fn(),
  writeFileSyncMock: vi.fn(),
  mkdirSyncMock: vi.fn(),
  createHashMock: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue('abcdef0123456789'),
  })),
}));

vi.mock('../index/symbol-index.js', async () => {
  const actual = await vi.importActual('../index/symbol-index.js');
  return {
    ...(actual as object),
    symbolIndex: {
      buildIndex: buildIndexMock,
    },
  };
});

vi.mock('../project-manager.js', () => ({
  projectManager: {
    getProjectsForPath: getProjectsForPathMock,
    ensureProject: ensureProjectMock,
  },
}));

vi.mock('../security.js', () => ({
  validateWorkspacePath: validateWorkspacePathMock,
}));

vi.mock('fs', () => ({
  default: {
    existsSync: existsSyncMock,
    statSync: statSyncMock,
    readFileSync: readFileSyncMock,
    writeFileSync: writeFileSyncMock,
    mkdirSync: mkdirSyncMock,
  },
}));

vi.mock('crypto', () => ({
  default: {
    createHash: createHashMock,
  },
}));

vi.mock('ts-morph', () => ({
  Node: {
    isClassDeclaration: (node: { __kind?: string }) => node?.__kind === 'class',
    isFunctionDeclaration: (node: { __kind?: string }) =>
      node?.__kind === 'function',
    isInterfaceDeclaration: (node: { __kind?: string }) =>
      node?.__kind === 'interface',
    isTypeAliasDeclaration: (node: { __kind?: string }) =>
      node?.__kind === 'type_alias',
    isEnumDeclaration: (node: { __kind?: string }) => node?.__kind === 'enum',
    isVariableDeclaration: (node: { __kind?: string }) =>
      node?.__kind === 'variable',
    isMethodDeclaration: (node: { __kind?: string }) =>
      node?.__kind === 'method',
    isPropertyDeclaration: (node: { __kind?: string }) =>
      node?.__kind === 'property',
    isParameterDeclaration: (node: { __kind?: string }) =>
      node?.__kind === 'parameter',
  },
}));

describe('buildSymbolIndex tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates to symbolIndex.buildIndex', async () => {
    buildIndexMock.mockResolvedValueOnce({ indexed: { files: 1 } });

    const result = await buildSymbolIndex('/repo');

    expect(buildIndexMock).toHaveBeenCalledWith('/repo');
    expect(result).toEqual({ indexed: { files: 1 } });
  });
});

describe('SymbolIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'memoryUsage').mockReturnValue({
      rss: 0,
      heapTotal: 0,
      heapUsed: 64 * 1024 * 1024,
      external: 0,
      arrayBuffers: 0,
    });
  });

  it('builds symbols and writes cache on first run', async () => {
    existsSyncMock.mockReturnValue(false);
    getProjectsForPathMock.mockResolvedValue(['/repo/tsconfig.json']);

    const sourceFile = {
      getFilePath: () => '/repo/src/a.ts',
      getExportedDeclarations: () =>
        new Map([
          [
            'hello',
            [
              {
                __kind: 'function',
                getStartLineNumber: () => 2,
                getStart: () => 20,
                getStartLinePos: () => 10,
              },
            ],
          ],
        ]),
      getFunctions: () => [
        {
          getName: () => 'localFn',
          getStartLineNumber: () => 5,
          getStart: () => 50,
          getStartLinePos: () => 40,
        },
      ],
      getClasses: () => [
        {
          getName: () => 'LocalClass',
          getStartLineNumber: () => 10,
          getStart: () => 100,
          getStartLinePos: () => 90,
        },
      ],
    };

    const project = {
      addSourceFilesFromTsConfig: vi.fn(),
      getSourceFiles: () => [sourceFile],
    };

    ensureProjectMock.mockReturnValue(project);
    statSyncMock.mockImplementation((target: string) => ({
      mtimeMs: target.includes('/repo/src/a.ts') ? 123 : 0,
    }));

    const index = new SymbolIndex();
    const stats = await index.buildIndex('/repo');

    expect(validateWorkspacePathMock).toHaveBeenCalledWith('/repo');
    expect(getProjectsForPathMock).toHaveBeenCalledWith('/safe/repo');
    expect(writeFileSyncMock).toHaveBeenCalledTimes(1);
    expect(stats.indexed.files).toBe(1);
    expect(stats.indexed.functions).toBe(2);
    expect(stats.indexed.classes).toBe(1);
    expect(index.lookup('localFn')).toHaveLength(1);
    expect(index.lookupByFile('/repo/src/a.ts')).toHaveLength(3);
  });

  it('reuses valid cache and avoids project parsing', async () => {
    const cached: DiskCache = {
      version: 1,
      rootDir: '/safe/repo',
      builtAt: new Date().toISOString(),
      fileHashes: {
        '/repo/src/a.ts': 123,
      },
      symbols: {
        cachedFn: [
          {
            name: 'cachedFn',
            kind: 'function',
            file: '/repo/src/a.ts',
            line: 1,
            column: 0,
            exported: true,
          },
        ],
      },
    };

    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(JSON.stringify(cached));
    statSyncMock.mockReturnValue({ mtimeMs: 123 });

    const index = new SymbolIndex();
    const stats = await index.buildIndex('/repo');

    expect(getProjectsForPathMock).not.toHaveBeenCalled();
    expect(writeFileSyncMock).not.toHaveBeenCalled();
    expect(index.lookup('cachedFn')).toHaveLength(1);
    expect(stats.indexed.files).toBe(1);
  });

  it('rebuilds when cache is stale due to file mtime change', async () => {
    const staleCache: DiskCache = {
      version: 1,
      rootDir: '/safe/repo',
      builtAt: new Date().toISOString(),
      fileHashes: {
        '/repo/src/a.ts': 111,
      },
      symbols: {},
    };

    existsSyncMock.mockReturnValue(true);
    readFileSyncMock.mockReturnValue(JSON.stringify(staleCache));
    statSyncMock.mockImplementation((target: string) => ({
      mtimeMs: target.includes('/repo/src/a.ts') ? 222 : 0,
    }));

    getProjectsForPathMock.mockResolvedValue(['/repo/tsconfig.json']);
    const sourceFile = {
      getFilePath: () => '/repo/src/a.ts',
      getExportedDeclarations: () => new Map(),
      getFunctions: () => [],
      getClasses: () => [],
    };
    const project = {
      addSourceFilesFromTsConfig: vi.fn(),
      getSourceFiles: () => [sourceFile],
    };
    ensureProjectMock.mockReturnValue(project);

    const index = new SymbolIndex();
    await index.buildIndex('/repo');

    expect(getProjectsForPathMock).toHaveBeenCalledTimes(1);
    expect(writeFileSyncMock).toHaveBeenCalledTimes(1);
  });
});
