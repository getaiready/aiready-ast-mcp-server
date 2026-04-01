# AST MCP Server - Critical Fix Plan

> Generated: 2026-04-01 | Review source: Gemini architectural review

## Executive Summary

All 6 issues in the Gemini review are **confirmed**. The current implementation is a PoC that will OOM on any real monorepo. This plan addresses all 6 issues in dependency order.

## Issue Status

| #   | Issue               | Severity        | Status    | Evidence                                                                         |
| --- | ------------------- | --------------- | --------- | -------------------------------------------------------------------------------- |
| 1   | Catastrophic OOM    | Critical        | Confirmed | `project-manager.ts:84-86` - `getProjectsForPath` loads ALL Projects immediately |
| 2   | O(N) AST Traversal  | Critical        | Confirmed | `typescript-adapter.ts:40-56` - iterates ALL source files, ALL identifiers       |
| 3   | Fake Symbol Index   | High            | Confirmed | `symbol-index.ts:23-28` - only counts symbols, no actual index                   |
| 4   | Broken Regex Search | Medium          | Confirmed | `search-code.ts:40` - `--fixed-strings` hardcoded, schema promises regex         |
| 5   | Path Traversal      | High (Security) | Confirmed | All tools pass user paths directly without workspace validation                  |
| 6   | No Worker Isolation | High            | Confirmed | All ts-morph ops on main thread, blocks MCP heartbeats                           |

## Decisions

| Decision         | Choice                                              |
| ---------------- | --------------------------------------------------- |
| Cache location   | `/tmp/ast-index-{sha256(rootDir).slice(0,12)}.json` |
| Worker pool size | `AST_WORKER_POOL_SIZE` env var, default `2`         |
| Scope            | All 6 issues, phases 1-6 in order                   |

## Implementation Order

```text
Phase 1: security.ts          [no deps, blocks all]
    |
Phase 2: project-manager.ts   [depends on Phase 1]
    |
Phase 3: symbol-index.ts      [depends on Phase 1, 2]
    |
Phase 4: typescript-adapter   [depends on Phase 1, 2, 3]
    |
Phase 5: search-code.ts       [depends on Phase 1 only]
    |
Phase 6: worker/pool.ts       [depends on Phase 1, 2, 3, 4]
```

---

## Phase 1: Path Security & Validation (Issue 5)

**Why first**: Every subsequent fix depends on safe path handling.

### New File: `src/security.ts`

```typescript
import path from 'path';
import fs from 'fs';

export function resolveWorkspaceRoot(): string {
  return process.env.AST_WORKSPACE_ROOT || process.cwd();
}

export function validateWorkspacePath(inputPath: string): string {
  const root = resolveWorkspaceRoot();
  const resolved = path.resolve(root, inputPath);
  const normalized = path.normalize(resolved);

  // Reject path traversal
  if (!normalized.startsWith(root)) {
    throw new Error(
      `Path traversal detected: ${inputPath} escapes workspace root`
    );
  }

  // Reject null bytes
  if (normalized.includes('\0')) {
    throw new Error('Path contains null bytes');
  }

  return normalized;
}

export function validateFileExists(filePath: string): string {
  const safe = validateWorkspacePath(filePath);
  if (!fs.existsSync(safe)) {
    throw new Error(`File not found: ${filePath}`);
  }
  if (!fs.statSync(safe).isFile()) {
    throw new Error(`Not a file: ${filePath}`);
  }
  return safe;
}
```

### Modified Files

- `project-manager.ts` - call `validateWorkspacePath` before `glob()` and `new Project()`
- `search-code.ts` - call `validateWorkspacePath` before passing to `rg`
- All tool files - call `validateWorkspacePath` before delegating to adapters

### Tests: `__tests__/security.test.ts`

- Path traversal attempts (`../../../etc/passwd`)
- Symlink escape attempts
- Null byte injection
- Valid relative paths resolve correctly
- Valid absolute paths within workspace

---

## Phase 2: Lazy Loading & Project Lifecycle (Issue 1)

**Why second**: Without this, the server crashes before any other fix matters.

### Rewrite: `src/project-manager.ts`

**Current (broken)**:

```typescript
getProjectsForPath(rootDir) -> configs.map(c => this.getOrCreateProject(c))
// Immediately loads ALL tsconfigs into memory as full ts-morph Projects
```

**New**:

```typescript
getProjectForFile(filePath)  -> lazy, single tsconfig lookup + Project creation
getProjectsForPath(rootDir)  -> returns string[] of tsconfig paths (NO Project instantiation)
ensureProject(tsconfigPath)  -> explicit lazy creation with LRU eviction
```

### LRU Cache Design

```typescript
class ProjectManager {
  private projects: Map<string, Project> = new Map();
  private accessOrder: string[] = []; // MRU at front
  private maxProjects: number = 4;

  ensureProject(tsconfigPath: string): Project {
    // Cache hit
    if (this.projects.has(tsconfigPath)) {
      this.moveToFront(tsconfigPath);
      return this.projects.get(tsconfigPath)!;
    }

    // Evict if full
    while (this.projects.size >= this.maxProjects) {
      const oldest = this.accessOrder.pop()!;
      this.disposeProject(oldest);
    }

    // Create with lazy file loading
    const project = new Project({
      tsConfigFilePath: tsconfigPath,
      skipAddingFilesFromTsConfig: true, // KEY: don't load all files
    });

    this.projects.set(tsconfigPath, project);
    this.accessOrder.unshift(tsconfigPath);
    return project;
  }

  disposeProject(tsconfigPath: string): void {
    const project = this.projects.get(tsconfigPath);
    if (project) {
      project.forgetFiles(); // Proper ts-morph cleanup
      this.projects.delete(tsconfigPath);
    }
  }

  disposeAll(): void {
    for (const [key] of this.projects) {
      this.disposeProject(key);
    }
    this.accessOrder = [];
  }
}
```

### Memory Pressure Detection

```typescript
private checkMemoryPressure(): void {
  const heapUsed = process.memoryUsage().heapUsed / 1024 / 1024;
  const maxHeap = parseInt(process.env.AST_MAX_HEAP_MB || '1536');

  while (heapUsed > maxHeap && this.projects.size > 1) {
    const oldest = this.accessOrder.pop()!;
    this.disposeProject(oldest);
  }
}
```

### Tests: `__tests__/project-manager.test.ts`

- LRU eviction order
- Lazy loading (Project not created until `ensureProject`)
- `disposeProject` frees memory
- `disposeAll` cleans everything
- Memory pressure eviction

---

## Phase 3: Real Symbol Index with Disk Cache (Issue 3)

**Why third**: Enables O(1) symbol lookup for Phase 4.

### Rewrite: `src/index/symbol-index.ts`

### Data Structures

```typescript
interface SymbolEntry {
  name: string;
  kind: SymbolKind;
  file: string;
  line: number;
  column: number;
  exported: boolean;
}

interface DiskCache {
  version: 1;
  rootDir: string;
  builtAt: string;
  fileHashes: Record<string, number>; // file -> mtimeMs
  symbols: Record<string, SymbolEntry[]>;
}
```

### Cache File Location

```
/tmp/ast-index-{sha256(rootDir).slice(0,12)}.json
```

### Build Logic

```typescript
async buildIndex(rootDir: string): Promise<IndexingStats> {
  const safeRoot = validateWorkspacePath(rootDir);
  const cachePath = this.getCachePath(safeRoot);

  // Check disk cache
  if (fs.existsSync(cachePath)) {
    const cached: DiskCache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    if (this.isCacheValid(cached, safeRoot)) {
      this.index = cached.symbols;
      return this.computeStats(cached);
    }
  }

  // Rebuild: iterate source files, extract symbols
  const tsconfigs = await projectManager.getProjectsForPath(safeRoot);
  const symbols: Record<string, SymbolEntry[]> = {};
  const fileHashes: Record<string, number> = {};

  for (const config of tsconfigs) {
    const project = projectManager.ensureProject(config);
    for (const sourceFile of project.getSourceFiles()) {
      const filePath = sourceFile.getFilePath();
      fileHashes[filePath] = fs.statSync(filePath).mtimeMs;

      // Extract exported declarations
      for (const [name, decls] of sourceFile.getExportedDeclarations()) {
        for (const decl of decls) {
          const entry: SymbolEntry = {
            name,
            kind: this.mapKind(decl),
            file: filePath,
            line: decl.getStartLineNumber(),
            column: decl.getStart() - decl.getStartLinePos(),
            exported: true,
          };
          (symbols[name] ||= []).push(entry);
        }
      }

      // Extract non-exported top-level declarations
      for (const fn of sourceFile.getFunctions()) {
        const name = fn.getName();
        if (name && !symbols[name]) {
          const entry: SymbolEntry = {
            name,
            kind: 'function',
            file: filePath,
            line: fn.getStartLineNumber(),
            column: fn.getStart() - fn.getStartLinePos(),
            exported: false,
          };
          (symbols[name] ||= []).push(entry);
        }
      }
      // Same for classes, interfaces, type aliases, enums...
    }
  }

  // Write to disk
  const cache: DiskCache = {
    version: 1,
    rootDir: safeRoot,
    builtAt: new Date().toISOString(),
    fileHashes,
    symbols,
  };
  fs.writeFileSync(cachePath, JSON.stringify(cache));

  this.index = symbols;
  return this.computeStats(cache);
}
```

### Cache Validation

```typescript
isCacheValid(cached: DiskCache, rootDir: string): boolean {
  if (cached.rootDir !== rootDir) return false;

  // Check if any file has changed
  for (const [file, cachedMtime] of Object.entries(cached.fileHashes)) {
    if (!fs.existsSync(file)) return false;
    if (fs.statSync(file).mtimeMs !== cachedMtime) return false;
  }

  return true;
}
```

### Lookup API

```typescript
lookup(name: string): SymbolEntry[] {
  return this.index[name] || [];
}

lookupByFile(file: string): SymbolEntry[] {
  return Object.values(this.index)
    .flat()
    .filter(e => e.file === file);
}
```

### Tests: `__tests__/symbol-index.test.ts`

- Build extracts real symbol names + locations
- `lookup("add")` returns correct file/line/column
- Disk cache written to `/tmp/ast-index-*.json`
- Cache hit on second build (no ts-morph re-parse)
- Cache invalidation when file mtime changes
- Cache invalidation when file deleted

---

## Phase 4: O(1) Symbol Resolution (Issue 2)

**Why fourth**: Depends on Phase 3 index for fast lookup.

### Rewrite: `src/adapters/typescript-adapter.ts` core methods

### New `resolveDefinition`

```typescript
async resolveDefinition(symbolName: string, inputPath: string): Promise<DefinitionLocation[]> {
  const safePath = validateWorkspacePath(inputPath);

  // Fast path: index lookup (O(1))
  const indexHits = symbolIndex.lookup(symbolName);
  if (indexHits.length > 0) {
    return indexHits.map(hit => ({
      file: hit.file,
      line: hit.line,
      column: hit.column,
      kind: hit.kind,
      snippet: '',  // enriched below
      documentation: undefined,
    }));
  }

  // Fallback: search specific file via ts-morph
  const tsconfig = await projectManager.findNearestTsConfig(safePath);
  if (!tsconfig) return [];

  const project = projectManager.ensureProject(tsconfig);
  const sourceFile = project.addSourceFileAtPath(safePath);
  if (!sourceFile) return [];

  const exported = sourceFile.getExportedDeclarations().get(symbolName);
  if (!exported) return [];

  return exported.map(decl => this.mapToDefinitionLocation(decl));
}
```

### New `findReferences`

```typescript
async findReferences(symbolName: string, inputPath: string, limit = 50, offset = 0) {
  const safePath = validateWorkspacePath(inputPath);

  // Index lookup to find definition location
  const hits = symbolIndex.lookup(symbolName);
  if (hits.length === 0) return { references: [], total_count: 0 };

  // Load only the definition file
  const hit = hits[0];
  const tsconfig = await projectManager.findNearestTsConfig(hit.file);
  if (!tsconfig) return { references: [], total_count: 0 };

  const project = projectManager.ensureProject(tsconfig);
  const sourceFile = project.addSourceFileAtPath(hit.file);

  // Find the node at the definition position
  const node = sourceFile.getDescendantAtPos(
    sourceFile.getLineAndColumnAtPos(hit.column).line,
    hit.column
  );

  if (!node) return { references: [], total_count: 0 };

  const refSymbols = (node as any).findReferences?.();
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
```

### Performance Target

| Operation                   | Before          | After                         |
| --------------------------- | --------------- | ----------------------------- |
| `resolve_definition("add")` | Parse all files | Index lookup + 0-1 file parse |
| `find_references("logger")` | Parse all files | Index lookup + 1 file parse   |
| Time (10k file monorepo)    | 30-120s         | 50-200ms                      |

### Tests

- Update `__tests__/resolve-definition.test.ts` - verify index-first fast path
- Update `__tests__/find-references.test.ts` - verify single-file loading

---

## Phase 5: Fix Regex Search (Issue 4)

**Why fifth**: Independent of AST, quick win.

### Modified: `src/tools/search-code.ts`

1. Remove `--fixed-strings` from default args
2. Add `regex: boolean` parameter (default `true` to match schema)
3. Add `--max-columns 500` to prevent hanging on minified files
4. Remove dead `resolvedRgPath` variable (lines 11-21, never used)

### Fixed Code

```typescript
export async function searchCode(
  pattern: string,
  searchPath: string,
  filePattern?: string,
  limit: number = 50,
  regex: boolean = true
): Promise<SearchResult[]> {
  const safePath = validateWorkspacePath(searchPath);

  const args = [
    '--json',
    '--max-count',
    limit.toString(),
    '--max-columns',
    '500',
  ];

  if (!regex) {
    args.push('--fixed-strings');
  }

  args.push(pattern, safePath);

  if (filePattern) {
    args.push('--glob', filePattern);
  }

  args.push('--glob', '!**/node_modules/**');
  args.push('--glob', '!**/dist/**');
  args.push('--glob', '!**/.git/**');

  // ... rest unchanged
}
```

### Modified: `src/schemas.ts`

```typescript
export const SearchCodeSchema = z.object({
  pattern: z.string().describe('Search pattern (regex by default)'),
  path: z.string().describe('Directory to search in'),
  filePattern: z.string().optional().describe('Glob filter (e.g., "*.ts")'),
  limit: z.number().optional().default(50).describe('Max matches to return'),
  regex: z
    .boolean()
    .optional()
    .default(true)
    .describe('Use regex mode (default true)'),
});
```

### Tests: `__tests__/search-code.test.ts`

- Regex pattern works (e.g., `foo.*bar`)
- Fixed-string mode works when `regex: false`
- Glob filter excludes correctly
- Minified file doesn't hang (max-columns)
- Path traversal rejected

---

## Phase 6: Worker Thread Isolation (Issue 6)

**Why last**: Most complex change, requires all prior fixes stable.

### New File: `src/worker/pool.ts`

```typescript
import { Worker } from 'worker_threads';
import path from 'path';
import { fileURLToPath } from 'url';

interface WorkerTask<T> {
  id: string;
  type: string;
  payload: unknown;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private available: Worker[] = [];
  private queue: WorkerTask<unknown>[] = [];
  private activeJobs = new Map<string, WorkerTask<unknown>>();
  private taskId = 0;

  constructor(private poolSize: number) {}

  async init(): Promise<void> {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const workerPath = path.join(__dirname, 'ast-worker.js');

    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(workerPath);
      worker.on('message', (msg) => this.handleResult(msg));
      worker.on('error', (err) => this.handleWorkerError(worker, err));
      this.workers.push(worker);
      this.available.push(worker);
    }
  }

  async execute<T>(type: string, payload: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = String(++this.taskId);
      const task: WorkerTask<T> = { id, type, payload, resolve, reject };

      const worker = this.available.pop();
      if (worker) {
        this.dispatch(worker, task);
      } else {
        this.queue.push(task as WorkerTask<unknown>);
      }
    });
  }

  private dispatch<T>(worker: Worker, task: WorkerTask<T>): void {
    this.activeJobs.set(task.id, task as WorkerTask<unknown>);
    worker.postMessage({ id: task.id, type: task.type, payload: task.payload });
  }

  private handleResult(msg: {
    id: string;
    result?: unknown;
    error?: string;
  }): void {
    const task = this.activeJobs.get(msg.id);
    if (!task) return;

    this.activeJobs.delete(msg.id);

    if (msg.error) {
      task.reject(new Error(msg.error));
    } else {
      task.resolve(msg.result);
    }

    // Return worker to pool
    const worker = this.workers.find(
      (w) =>
        !this.available.includes(w) && ![...this.activeJobs.values()].some()
    );
    if (worker) this.available.push(worker);

    // Process queue
    const next = this.queue.shift();
    if (next && this.available.length > 0) {
      this.dispatch(this.available.pop()!, next);
    }
  }

  private handleWorkerError(worker: Worker, err: Error): void {
    // Restart failed worker
    const idx = this.workers.indexOf(worker);
    if (idx !== -1) {
      worker.terminate();
      const newWorker = new Worker(worker.threadId); // respawn
      this.workers[idx] = newWorker;
      this.available.push(newWorker);
    }
  }

  async terminate(): Promise<void> {
    await Promise.all(this.workers.map((w) => w.terminate()));
    this.workers = [];
    this.available = [];
  }
}
```

### New File: `src/worker/ast-worker.ts`

```typescript
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

parentPort?.on(
  'message',
  async (msg: { id: string; type: string; payload: any }) => {
    try {
      let result: unknown;

      switch (msg.type) {
        case 'resolve_definition': {
          const project = getProject(msg.payload.tsconfig);
          const sf = project.addSourceFileAtPath(msg.payload.file);
          const exported = sf
            ?.getExportedDeclarations()
            .get(msg.payload.symbol);
          result =
            exported?.map((decl) => ({
              file: decl.getSourceFile().getFilePath(),
              line: decl.getStartLineNumber(),
              column: decl.getStart() - decl.getStartLinePos(),
              kind: decl.getKindName(),
              snippet: decl.getText(),
            })) || [];
          break;
        }

        case 'find_references': {
          const project = getProject(msg.payload.tsconfig);
          const sf = project.addSourceFileAtPath(msg.payload.file);
          // ... find references logic
          result = []; // placeholder
          break;
        }

        default:
          throw new Error(`Unknown task type: ${msg.type}`);
      }

      parentPort?.postMessage({ id: msg.id, result });
    } catch (error: any) {
      parentPort?.postMessage({ id: msg.id, error: error.message });
    }
  }
);
```

### Modified: `src/adapters/typescript-adapter.ts`

```typescript
import { WorkerPool } from '../worker/pool.js';

export class TypeScriptAdapter {
  private pool: WorkerPool;

  constructor() {
    const poolSize = parseInt(process.env.AST_WORKER_POOL_SIZE || '2');
    this.pool = new WorkerPool(poolSize);
  }

  async resolveDefinition(symbolName: string, inputPath: string): Promise<DefinitionLocation[]> {
    const safePath = validateWorkspacePath(inputPath);

    // Fast path: index lookup
    const indexHits = symbolIndex.lookup(symbolName);
    if (indexHits.length > 0) {
      return indexHits.map(hit => ({ ... }));
    }

    // Worker path: heavy ts-morph work off main thread
    const tsconfig = await projectManager.findNearestTsConfig(safePath);
    if (!tsconfig) return [];

    return this.pool.execute<DefinitionLocation[]>('resolve_definition', {
      tsconfig,
      file: safePath,
      symbol: symbolName,
    });
  }

  async shutdown(): Promise<void> {
    await this.pool.terminate();
  }
}
```

### Tests: `__tests__/worker-pool.test.ts`

- Task dispatch and result return
- Error propagation
- Worker restart on crash
- Pool exhaustion queues tasks
- Graceful termination

---

## File Manifest

| File                                 | Action  | Phase |
| ------------------------------------ | ------- | ----- |
| `src/security.ts`                    | CREATE  | 1     |
| `src/project-manager.ts`             | REWRITE | 2     |
| `src/index/symbol-index.ts`          | REWRITE | 3     |
| `src/adapters/typescript-adapter.ts` | REWRITE | 4     |
| `src/tools/search-code.ts`           | MODIFY  | 5     |
| `src/schemas.ts`                     | MODIFY  | 5     |
| `src/worker/pool.ts`                 | CREATE  | 6     |
| `src/worker/ast-worker.ts`           | CREATE  | 6     |
| `__tests__/security.test.ts`         | CREATE  | 1     |
| `__tests__/project-manager.test.ts`  | CREATE  | 2     |
| `__tests__/symbol-index.test.ts`     | CREATE  | 3     |
| `__tests__/search-code.test.ts`      | CREATE  | 5     |
| `__tests__/worker-pool.test.ts`      | CREATE  | 6     |

## Verification Checklist

After each phase:

- [ ] `pnpm test` passes
- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes

After all phases:

- [ ] `pnpm test-mcp` passes against real monorepo
- [ ] No OOM with `node --max-old-space-size=512 dist/index.js`
- [ ] `resolve_definition` returns <500ms on 10k-file project
- [ ] Path traversal attempts rejected with clear error
- [ ] Regex search works (e.g., `foo.*bar`)
- [ ] Disk cache survives server restart
- [ ] Worker pool handles concurrent requests
