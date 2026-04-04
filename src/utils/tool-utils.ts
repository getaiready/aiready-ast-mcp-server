import { typescriptAdapter } from '../adapters/typescript-adapter.js';

/**
 * Generic wrapper for symbol-related adapter calls to reduce boilerplate.
 */
export async function wrapAdapterCall<T>(
  methodName: keyof typeof typescriptAdapter,
  symbol: string,
  path: string,
  ...args: any[]
): Promise<T> {
  const method = typescriptAdapter[methodName] as (
    ...args: any[]
  ) => Promise<T>;
  return await method.apply(typescriptAdapter, [symbol, path, ...args]);
}
