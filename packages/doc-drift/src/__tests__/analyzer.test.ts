import { analyzeDocDrift } from '../analyzer';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Doc Drift Analyzer', () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = join(tmpdir(), `doc-drift-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });

    // File with signature mismatch
    const file1 = join(tmpDir, 'file1.ts');
    writeFileSync(
      file1,
      `
/**
 * Adds numbers.
 * @param a First number
 */
export function add(a: number, b: number) {
  return a + b;
}
    `
    );

    // File with undocumented complexity (simulated by lines > 20)
    const file2 = join(tmpDir, 'file2.ts');
    writeFileSync(
      file2,
      `
export function complexFunction(data: any) {
  let result = 0;
  for (let i = 0; i < 10; i++) {
    if (data && data.includes(i)) result += i;
  }
  for (let j = 0; j < 15; j++) {
    result -= j;
  }
  for (let j = 0; j < 15; j++) {
    result -= j;
  }
  for (let j = 0; j < 15; j++) {
    result -= j;
  }
  for (let j = 0; j < 15; j++) {
    result -= j;
  }
  for (let j = 0; j < 15; j++) {
    result -= j;
  }
  for (let k = 0; k < 5; k++) {
    result += k;
  }
  return result;
}
    `
    );
  });

  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('detects missing param documentation and uncommented complexity', async () => {
    const report = await analyzeDocDrift({
      rootDir: tmpDir,
    });

    // totalExports = 2 (add, complexFunction)
    expect(report.summary.functionsAnalyzed).toBe(2);

    // "add" has a JSDoc, but missing "b" param. "complexFunction" has NO JSDoc.
    expect(report.rawData.uncommentedExports).toBe(1);
    expect(report.rawData.outdatedComments).toBe(1);
    expect(report.rawData.undocumentedComplexity).toBe(1);
    expect(report.rawData.actualDrift).toBe(0);

    expect(report.issues.length).toBeGreaterThan(0);
    expect(report.issues.some((i) => i.message.includes('b'))).toBe(true);
  });
});
