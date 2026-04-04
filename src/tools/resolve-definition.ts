import { wrapAdapterCall } from '../utils/tool-utils.js';
import { DefinitionLocation } from '../types.js';

/**
 * Resolve the definition of a symbol.
 */
export async function resolveDefinition(
  symbol: string,
  path: string
): Promise<DefinitionLocation[]> {
  return await wrapAdapterCall<DefinitionLocation[]>(
    'resolveDefinition',
    symbol,
    path
  );
}
