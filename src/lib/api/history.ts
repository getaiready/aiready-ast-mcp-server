import type { Analysis } from '@/lib/db';

/**
 * Fetches analysis history for a repository.
 * @param repoId - The repository ID
 * @param limit - Maximum number of history items to fetch (default: 30)
 * @returns Promise resolving to an array of Analysis objects (reversed for timeline)
 */
export async function fetchRepoHistory(
  repoId: string,
  limit: number = 30
): Promise<Analysis[]> {
  try {
    const res = await fetch(`/api/repos/${repoId}/history?limit=${limit}`);
    const data = await res.json();
    if (res.ok) {
      return data.analyses.reverse();
    }
    return [];
  } catch (_err) {
    console.error('Failed to fetch history:', _err);
    return [];
  }
}
