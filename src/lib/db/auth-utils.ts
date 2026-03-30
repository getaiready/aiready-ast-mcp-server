import { createHash, randomBytes } from 'node:crypto';
import {
  putItem,
  queryItems,
  deleteItem,
  PK,
  SK,
  GSI,
  buildUpdateExpression,
  updateItem,
} from './helpers';
import type { ApiKey, MagicLinkToken } from './types';

// API Key operations
export async function createApiKey(
  userId: string,
  name: string
): Promise<{ key: string; apiKeyId: string }> {
  const apiKeyId = randomBytes(16).toString('hex');
  const rawKey = `ar_${randomBytes(32).toString('hex')}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const prefix = `${rawKey.substring(0, 7)}...`;

  const item: ApiKey = {
    id: apiKeyId,
    userId,
    name,
    keyHash,
    prefix,
    createdAt: new Date().toISOString(),
  };

  const dbItem = {
    PK: PK.user(userId),
    SK: SK.apiKey(apiKeyId),
    GSI1PK: GSI.apiKeys.pk,
    GSI1SK: keyHash,
    ...item,
  };
  await putItem(dbItem);
  return { key: rawKey, apiKeyId };
}

export async function listUserApiKeys(userId: string): Promise<ApiKey[]> {
  return queryItems<ApiKey>({
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
    ExpressionAttributeValues: {
      ':pk': PK.user(userId),
      ':prefix': 'APIKEY#',
    },
  });
}

export async function deleteApiKey(
  userId: string,
  apiKeyId: string
): Promise<void> {
  await deleteItem({ PK: PK.user(userId), SK: SK.apiKey(apiKeyId) });
}

// Magic Link operations
export async function createMagicLinkToken(
  tokenData: MagicLinkToken
): Promise<string> {
  await putItem({
    PK: PK.magic(tokenData.token),
    SK: SK.metadata,
    ...tokenData,
  });
  return tokenData.token;
}

export async function getMagicLinkToken(
  token: string
): Promise<MagicLinkToken | null> {
  const items = await queryItems<MagicLinkToken>({
    KeyConditionExpression: 'PK = :pk AND SK = :sk',
    ExpressionAttributeValues: {
      ':pk': PK.magic(token),
      ':sk': SK.metadata,
    },
  });
  return items[0] || null;
}

export async function markMagicLinkUsed(token: string): Promise<void> {
  const expr = buildUpdateExpression({ used: true });
  if (!expr) return;
  await updateItem(
    { PK: PK.magic(token), SK: SK.metadata },
    expr.expression,
    expr.values,
    expr.names
  );
}
