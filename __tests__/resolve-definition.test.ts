import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { resolveDefinition } from '../src/tools/resolve-definition.js';
import { buildSymbolIndex } from '../src/tools/build-symbol-index.js';

describe('resolveDefinition', () => {
  const fixturePath = path.resolve(__dirname, 'fixtures/simple-project');

  beforeAll(async () => {
    await buildSymbolIndex(fixturePath);
  });

  it('should resolve a function definition', async () => {
    const results = await resolveDefinition('add', fixturePath);
    expect(results.length).toBeGreaterThan(0);
    const def = results[0];
    expect(def.file).toContain('utils.ts');
    expect(def.kind).toBe('function');
    expect(def.documentation).toContain('Add two numbers');
  });

  it('should resolve a class definition', async () => {
    const results = await resolveDefinition('App', fixturePath);
    expect(results.length).toBeGreaterThan(0);
    const def = results[0];
    expect(def.file).toContain('index.ts');
    expect(def.kind).toBe('class');
    expect(def.documentation).toContain('Main application class');
  });
});
