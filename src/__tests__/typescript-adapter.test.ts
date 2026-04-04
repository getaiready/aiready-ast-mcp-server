import { describe, it, expect, beforeAll, vi, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import { TypeScriptAdapter } from '../adapters/typescript-adapter.js';
import { symbolIndex } from '../index/symbol-index.js';
import { WorkerPool } from '../worker/pool.js';

vi.mock('../worker/pool.js', () => {
  return {
    WorkerPool: vi.fn().mockImplementation(function () {
      return {
        init: vi.fn().mockResolvedValue(undefined),
        execute: vi.fn().mockImplementation(async (type, payload: any) => {
          if (type === 'find_implementations' && payload.symbol === 'App') {
            return {
              implementations: [
                { file: 'index.ts', line: 6, column: 0, text: 'class App' },
              ],
              total_count: 1,
            };
          }
          return [];
        }),
        terminate: vi.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

describe('TypeScriptAdapter', () => {
  const fixturePath = path.resolve(
    __dirname,
    '../../__tests__/fixtures/simple-project'
  );
  let adapter: TypeScriptAdapter;

  beforeAll(async () => {
    process.env.AST_DISABLE_CACHE = 'true';
    adapter = new TypeScriptAdapter();
    await symbolIndex.buildIndex(fixturePath);
  });

  afterAll(async () => {
    await adapter.shutdown();
  });

  it('should resolve definition from index', async () => {
    const results = await adapter.resolveDefinition('add', fixturePath);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].file).toContain('utils.ts');
    expect(results[0].kind).toBe('function');
  });

  it('should resolve definition via fallback/worker if not in index', async () => {
    // "NonExistent" is not in index initially
    const results = await adapter.resolveDefinition(
      'NonExistent',
      path.join(fixturePath, 'src/utils.ts')
    );
    expect(results).toEqual([]);
  });

  it('should find implementations', async () => {
    const hits = symbolIndex.lookup('App');
    console.error(`[TEST DEBUG] hits for App: ${JSON.stringify(hits)}`);
    const { implementations, total_count } = await adapter.findImplementations(
      'App',
      fixturePath
    );
    expect(total_count).toBeGreaterThan(0);
    expect(implementations[0].file).toContain('index.ts');
  });

  it('should get file structure', async () => {
    const filePath = path.join(fixturePath, 'src/index.ts');
    const structure = await adapter.getFileStructure(filePath);
    expect(structure).toBeDefined();
    expect(structure?.file).toBe(filePath);
    expect(structure?.classes.length).toBe(1);
    expect(structure?.classes[0].name).toBe('App');
    expect(structure?.imports.some((imp) => imp.module === './utils.js')).toBe(
      true
    );
  });

  it('should handle missing files gracefully in getFileStructure', async () => {
    const result = await adapter.getFileStructure(
      path.join(fixturePath, 'non-existent.ts')
    );
    expect(result).toBeUndefined();
  });

  it('should deduplicate locations', async () => {
    // Accessing private method for testing coverage of the utility
    const locations = [
      { file: 'a.ts', line: 1, column: 1 },
      { file: 'a.ts', line: 1, column: 1 },
      { file: 'b.ts', line: 1, column: 1 },
    ];
    const unique = (adapter as any).deduplicateLocations(locations);
    expect(unique.length).toBe(2);
  });
});
