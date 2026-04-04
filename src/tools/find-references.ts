import { wrapAdapterCall } from '../utils/tool-utils.js';

/**
 * Find all references to a specific symbol in the project.
 */
export async function findReferences(
  symbol: string,
  path: string,
  limit: number = 50,
  offset: number = 0
) {
  return await wrapAdapterCall('findReferences', symbol, path, limit, offset);
}
