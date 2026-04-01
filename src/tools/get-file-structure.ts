import { typescriptAdapter } from '../adapters/typescript-adapter.js';

export async function getFileStructure(file: string) {
  return await typescriptAdapter.getFileStructure(file);
}
