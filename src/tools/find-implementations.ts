import { wrapAdapterCall } from '../utils/tool-utils.js';

/**
 * Find all implementations of a specific interface or class.
 */
export async function findImplementations(
  symbol: string,
  path: string,
  limit: number = 50,
  offset: number = 0
) {
  return await wrapAdapterCall(
    'findImplementations',
    symbol,
    path,
    limit,
    offset
  );
}
