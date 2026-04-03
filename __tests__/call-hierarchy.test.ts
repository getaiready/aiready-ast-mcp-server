import { describe, it, expect, beforeAll } from 'vitest';
import path from 'path';
import { getCallHierarchy } from '../src/tools/call-hierarchy.js';
import { buildSymbolIndex } from '../src/tools/build-symbol-index.js';

describe('getCallHierarchy', () => {
  const fixturePath = path.resolve(__dirname, 'fixtures/simple-project');

  beforeAll(async () => {
    await buildSymbolIndex(fixturePath);
  });

  it('should find incoming calls for a function', async () => {
    const result = await getCallHierarchy('add', fixturePath, 'incoming');

    expect(result.symbol).toBe('add');
    expect(result.incoming.length).toBeGreaterThan(0);
    // In our simple fixture, add is called in index.ts
    expect(result.incoming.some((inc) => inc.file.includes('index.ts'))).toBe(
      true
    );
  });

  it('should find outgoing calls for a function', async () => {
    // In our simple fixture, App.run calls Logger.log and add
    const result = await getCallHierarchy('App', fixturePath, 'outgoing');

    expect(result.outgoing.length).toBeGreaterThan(0);
    // It should detect calls to add or Logger.log
    expect(
      result.outgoing.some(
        (out) =>
          out.name === 'add' || out.name === 'log' || out.name === 'Logger.log'
      )
    ).toBe(true);
  });
});
