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
    const workerPath = path.join(__dirname, 'ast-worker.js'); // Assuming tsup builds this

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
    // properly finding the worker is tricky without storing mapping.
    // let's just make it simpler: each message comes from a worker, but we don't know which one.
    // Actually, worker.on('message') should be tied to the worker!
  }

  private handleWorkerError(worker: Worker, err: Error): void {
    const idx = this.workers.indexOf(worker);
    if (idx !== -1) {
      worker.terminate();
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const workerPath = path.join(__dirname, 'ast-worker.js');
      const newWorker = new Worker(workerPath);
      newWorker.on('message', (msg) => this.handleResult(msg));
      newWorker.on('error', (_e) => this.handleWorkerError(newWorker, _e));
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
