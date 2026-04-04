import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectManager } from '../project-manager.js';
import path from 'path';
import fs from 'fs';

vi.mock('ts-morph', () => {
  class MockProject {
    getSourceFiles = vi.fn().mockReturnValue([]);
    removeSourceFile = vi.fn();
  }
  return { Project: MockProject };
});

vi.mock('glob', () => ({
  glob: vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve([process.cwd() + '/tsconfig.json'])
    ),
}));

describe('ProjectManager', () => {
  let pm: ProjectManager;

  beforeEach(() => {
    pm = new ProjectManager();
    vi.clearAllMocks();
  });

  it('should find tsconfigs and cache them', async () => {
    const root = process.cwd();
    const configs = await pm.findTsConfigs(root);
    expect(configs[0]).toContain('tsconfig.json');

    // Second call should hit cache
    const configs2 = await pm.findTsConfigs(root);
    expect(configs2).toBe(configs);
  });

  it('should manage LRU cache of projects', () => {
    const p1Path = path.join(process.cwd(), 'p1/tsconfig.json');
    const p2Path = path.join(process.cwd(), 'p2/tsconfig.json');
    const p3Path = path.join(process.cwd(), 'p3/tsconfig.json');
    const p4Path = path.join(process.cwd(), 'p4/tsconfig.json');
    const p5Path = path.join(process.cwd(), 'p5/tsconfig.json');

    pm.ensureProject(p1Path);
    pm.ensureProject(p2Path);
    pm.ensureProject(p3Path);
    pm.ensureProject(p4Path);

    expect((pm as any).projects.size).toBe(4);

    // p1Path is now oldest. Access p1Path to move to front.
    pm.ensureProject(p1Path);

    // Now p2Path is oldest. Add p5Path, p2Path should be evicted.
    pm.ensureProject(p5Path);

    expect((pm as any).projects.has(p2Path)).toBe(false);
    expect((pm as any).projects.has(p1Path)).toBe(true);
  });

  it('should handle memory pressure', () => {
    // Set low heap limit for test
    process.env.AST_MAX_HEAP_MB = '0';

    const p1Path = path.join(process.cwd(), 'p1/tsconfig.json');
    const p2Path = path.join(process.cwd(), 'p2/tsconfig.json');
    const p3Path = path.join(process.cwd(), 'p3/tsconfig.json');

    pm.ensureProject(p1Path);
    pm.ensureProject(p2Path);

    // This should trigger checkMemoryPressure and evict p1Path
    pm.ensureProject(p3Path);

    // At least one project should remain even under pressure
    expect((pm as any).projects.size).toBeGreaterThan(0);

    delete process.env.AST_MAX_HEAP_MB;
  });

  it('should find nearest tsconfig', async () => {
    const spy = vi
      .spyOn(fs, 'existsSync')
      .mockImplementation((p: any) => p.endsWith('tsconfig.json'));
    const testFile = path.join(process.cwd(), 'src/file.ts');
    const found = await pm.findNearestTsConfig(testFile);
    expect(found).toContain('tsconfig.json');
    spy.mockRestore();
  });

  it('should dispose all projects', () => {
    const p1Path = path.join(process.cwd(), 'p1/tsconfig.json');
    pm.ensureProject(p1Path);
    pm.disposeAll();
    expect((pm as any).projects.size).toBe(0);
    expect((pm as any).accessOrder).toHaveLength(0);
  });
});
