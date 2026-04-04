import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { findReferences } from '../src/tools/find-references.js';
import { buildSymbolIndex } from '../src/tools/build-symbol-index.js';
import { ReferenceLocation } from '../src/types.js';

describe('findReferences', () => {
  const fixturePath = path.resolve(__dirname, 'fixtures/simple-project');

  beforeAll(async () => {
    await buildSymbolIndex(fixturePath);
  });

  it('should find references to a function', async () => {
    const { references, total_count } = (await findReferences(
      'add',
      fixturePath
    )) as { references: ReferenceLocation[]; total_count: number };
    expect(total_count).toBeGreaterThan(0);
    console.log('References:', references);
    expect(references.some((ref) => ref.file.includes('index.ts'))).toBe(true);
  });

  it('should find references to a class', async () => {
    const { references, total_count } = (await findReferences(
      'App',
      fixturePath
    )) as { references: ReferenceLocation[]; total_count: number };
    expect(total_count).toBeGreaterThan(0);
  });
});
