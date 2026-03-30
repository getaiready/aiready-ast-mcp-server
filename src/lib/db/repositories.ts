import {
  putItem,
  getItem,
  queryItems,
  deleteItem,
  PK,
  repoKey,
  updateItem,
  buildUpdateExpression,
} from './helpers';
import type { Repository } from './types';

export async function createRepository(repo: Repository): Promise<Repository> {
  const now = new Date().toISOString();
  const item = {
    ...repoKey(repo.id),
    GSI1PK: repo.teamId ? PK.team(repo.teamId) : PK.user(repo.userId),
    GSI1SK: `REPO#${repo.id}`,
    ...repo,
    createdAt: repo.createdAt || now,
    updatedAt: now,
  };
  await putItem(item);
  return repo;
}

export async function getRepository(
  repoId: string
): Promise<Repository | null> {
  return getItem<Repository>(repoKey(repoId));
}

export async function listUserRepositories(
  userId: string
): Promise<Repository[]> {
  return queryItems<Repository>({
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk': PK.user(userId),
      ':prefix': 'REPO#',
    },
    ScanIndexForward: false,
  });
}

export async function listTeamRepositories(
  teamId: string
): Promise<Repository[]> {
  return queryItems<Repository>({
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk': PK.team(teamId),
      ':prefix': 'REPO#',
    },
    ScanIndexForward: false,
  });
}

export async function deleteRepository(repoId: string): Promise<void> {
  await deleteItem(repoKey(repoId));
}

export async function updateRepositoryScore(
  repoId: string,
  score: number,
  lastCommitHash?: string
): Promise<void> {
  const updates = {
    aiScore: score,
    lastAnalysisAt: new Date().toISOString(),
    isScanning: false,
    lastCommitHash: lastCommitHash || null,
  } as Record<string, unknown>;

  const expr = buildUpdateExpression(updates);
  if (!expr) return;

  await updateItem(repoKey(repoId), expr.expression, expr.values, expr.names);
}

export async function setRepositoryScanning(
  repoId: string,
  isScanning: boolean,
  lastError?: string | null
): Promise<void> {
  const updates: any = { isScanning };
  if (lastError !== undefined) {
    updates.lastError = lastError;
  }
  const expr = buildUpdateExpression(updates);
  if (!expr) return;
  await updateItem(repoKey(repoId), expr.expression, expr.values, expr.names);
}

export async function updateRepositoryConfig(
  repoId: string,
  config: Record<string, unknown>
): Promise<void> {
  const filtered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(config || {})) {
    if (k === 'id') continue;
    filtered[k] = v;
  }

  const expr = buildUpdateExpression(filtered);
  if (!expr) return;

  await updateItem(repoKey(repoId), expr.expression, expr.values, expr.names);
}
