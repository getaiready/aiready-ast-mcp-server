import { symbolIndex } from '../index/symbol-index.js';

export async function buildSymbolIndex(path: string) {
  return await symbolIndex.buildIndex(path);
}
