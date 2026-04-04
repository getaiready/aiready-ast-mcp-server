import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkerPool } from '../worker/pool.js';
import { Worker } from 'worker_threads';

vi.mock('worker_threads', () => {
  const Worker = vi.fn().mockImplementation(function (this: any) {
    this.on = vi.fn();
    this.postMessage = vi.fn();
    this.terminate = vi.fn().mockResolvedValue(0);
    return this;
  });
  return { Worker };
});

describe('WorkerPool', () => {
  let pool: WorkerPool;

  beforeEach(() => {
    vi.clearAllMocks();
    pool = new WorkerPool(2);
  });

  const setupMockWorker = () => {
    let messageHandler: any;
    const mockWorkerInstance = {
      on: vi.fn(function (this: any, event, handler) {
        if (event === 'message') messageHandler = handler;
      }),
      postMessage: vi.fn(),
      terminate: vi.fn().mockResolvedValue(0),
    };
    (Worker as any).mockImplementation(function () {
      return mockWorkerInstance;
    });
    return { mockWorkerInstance, getHandler: () => messageHandler };
  };

  it('should initialize workers', async () => {
    setupMockWorker();
    await pool.init();
    expect(Worker).toHaveBeenCalledTimes(2);
  });

  it('should execute a task', async () => {
    const { mockWorkerInstance, getHandler } = setupMockWorker();
    pool = new WorkerPool(1);
    await pool.init();

    const promise = pool.execute('test', { foo: 'bar' });

    getHandler()({ id: '1', result: 'success' });

    const result = await promise;
    expect(result).toBe('success');
    expect(mockWorkerInstance.postMessage).toHaveBeenCalledWith({
      id: '1',
      type: 'test',
      payload: { foo: 'bar' },
    });
  });

  it('should handle task error', async () => {
    const { getHandler } = setupMockWorker();
    pool = new WorkerPool(1);
    await pool.init();

    const promise = pool.execute('test', {});
    getHandler()({ id: '1', error: 'failed' });

    await expect(promise).rejects.toThrow('failed');
  });

  it('should queue tasks if no workers available', async () => {
    const { mockWorkerInstance, getHandler } = setupMockWorker();
    pool = new WorkerPool(1);
    await pool.init();

    // Use first worker
    const p1 = pool.execute('t1', {});
    expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(1);

    // This should be queued
    const p2 = pool.execute('t2', {});
    expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(1);

    // Complete first task
    getHandler()({ id: '1', result: 'r1' });
    await p1;

    // Now second task should be dispatched
    expect(mockWorkerInstance.postMessage).toHaveBeenCalledTimes(2);
    getHandler()({ id: '2', result: 'r2' });
    await p2;
  });

  it('should terminate all workers', async () => {
    setupMockWorker();
    await pool.init();
    await pool.terminate();
    expect(Worker).toHaveBeenCalledTimes(2);
  });
});
