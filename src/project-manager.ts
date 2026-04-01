import { Project } from 'ts-morph';
import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import { validateWorkspacePath } from './security.js';

/**
 * ProjectManager handles tsconfig discovery and Project lifecycle.
 * One Project per tsconfig.json to handle monorepo project boundaries correctly.
 */
export class ProjectManager {
  private projects: Map<string, Project> = new Map();
  private tsconfigCache: Map<string, string[]> = new Map();
  private accessOrder: string[] = []; // MRU at front
  private maxProjects: number = 4;

  /**
   * Find all tsconfig.json files in a directory (recursive)
   */
  public async findTsConfigs(rootDir: string): Promise<string[]> {
    const safeRoot = validateWorkspacePath(rootDir);
    if (this.tsconfigCache.has(safeRoot)) {
      return this.tsconfigCache.get(safeRoot)!;
    }

    const configs = await glob('**/tsconfig.json', {
      cwd: safeRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**'],
    });

    this.tsconfigCache.set(safeRoot, configs);
    return configs;
  }

  /**
   * Ensure a Project exists for a given tsconfig path, managing LRU cache
   */
  public ensureProject(tsconfigPath: string): Project {
    this.checkMemoryPressure();

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

  /**
   * Move a tsconfig path to the front of the access order (MRU)
   */
  private moveToFront(tsconfigPath: string) {
    const index = this.accessOrder.indexOf(tsconfigPath);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.unshift(tsconfigPath);
    }
  }

  private checkMemoryPressure(): void {
    const heapUsed = process.memoryUsage().heapUsed / 1024 / 1024;
    const maxHeap = parseInt(process.env.AST_MAX_HEAP_MB || '1536', 10);

    while (heapUsed > maxHeap && this.projects.size > 1) {
      const oldest = this.accessOrder.pop()!;
      this.disposeProject(oldest);
    }
  }

  public disposeProject(tsconfigPath: string): void {
    const project = this.projects.get(tsconfigPath);
    if (project) {
      // Forget files explicitly
      for (const sourceFile of project.getSourceFiles()) {
        project.removeSourceFile(sourceFile);
      }
      this.projects.delete(tsconfigPath);
    }
  }

  /**
   * Find the nearest tsconfig.json for a file
   */
  public async findNearestTsConfig(
    filePath: string
  ): Promise<string | undefined> {
    const safePath = validateWorkspacePath(filePath);
    let currentDir = path.dirname(safePath);
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
      const tsconfigPath = path.join(currentDir, 'tsconfig.json');
      if (fs.existsSync(tsconfigPath)) {
        return tsconfigPath;
      }
      currentDir = path.dirname(currentDir);
    }

    return undefined;
  }

  /**
   * Get all tsconfigs for a path
   */
  public async getProjectsForPath(rootDir: string): Promise<string[]> {
    return this.findTsConfigs(rootDir);
  }

  /**
   * Dispose all projects to free memory
   */
  public disposeAll(): void {
    for (const [key] of this.projects) {
      this.disposeProject(key);
    }
    this.accessOrder = [];
  }
}

export const projectManager = new ProjectManager();
