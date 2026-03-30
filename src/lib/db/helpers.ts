import {
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { doc, TABLE_NAME } from './client';

// Common PK/SK patterns
export const PK = {
  repo: (id: string) => `REPO#${id}`,
  team: (id: string) => `TEAM#${id}`,
  user: (id: string) => `USER#${id}`,
  analysis: (id: string) => `ANALYSIS#${id}`,
  remediation: (id: string) => `REMEDIATION#${id}`,
  magic: (token: string) => `MAGIC#${token}`,
  apiKeyHash: (hash: string) => `APIKEY#${hash}`,
};

export const SK = {
  metadata: '#METADATA',
  member: (userId: string) => `#MEMBER#${userId}`,
  remediation: (id: string) => `REMEDIATION#${id}`,
  apiKey: (id: string) => `APIKEY#${id}`,
  ruleset: 'RULESET#DEFAULT',
};

// Common GSI patterns
export const GSI = {
  teams: { pk: 'TEAMS', index: 'GSI1' },
  users: { pk: 'USERS', index: 'GSI1' },
  apiKeys: { pk: 'APIKEYS', index: 'GSI1' },
};

// Helper functions for common operations
export async function putItem<T extends Record<string, unknown>>(
  item: T
): Promise<void> {
  await doc.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
}

export async function getItem<T>(
  key: Record<string, string>
): Promise<T | null> {
  const result = await doc.send(
    new GetCommand({ TableName: TABLE_NAME, Key: key })
  );
  return (result.Item as T) || null;
}

export async function queryItems<T>(
  params: Omit<ConstructorParameters<typeof QueryCommand>[0], 'TableName'>
): Promise<T[]> {
  const result = await doc.send(
    new QueryCommand({ TableName: TABLE_NAME, ...params })
  );
  return (result.Items || []) as T[];
}

export async function updateItem(
  key: Record<string, string>,
  updateExpression: string,
  expressionAttributeValues: Record<string, unknown>,
  expressionAttributeNames?: Record<string, string>
): Promise<void> {
  await doc.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );
}

export async function deleteItem(key: Record<string, string>): Promise<void> {
  await doc.send(new DeleteCommand({ TableName: TABLE_NAME, Key: key }));
}

export async function batchPutItems(
  items: Record<string, unknown>[]
): Promise<void> {
  if (items.length === 0) return;
  await doc.send(
    new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: items.map((Item) => ({ PutRequest: { Item } })),
      },
    })
  );
}
// Helper to build update expression from partial object
export type UpdateExpressionParts = {
  expression: string;
  values: Record<string, unknown>;
  names: Record<string, string>;
};

export function buildUpdateExpression(
  updates: Record<string, unknown> | undefined
): UpdateExpressionParts | null {
  if (!updates || Object.keys(updates).length === 0) return null;
  const setExpressions: string[] = [];
  const values: Record<string, unknown> = {};
  const names: Record<string, string> = {};
  let idx = 0;
  for (const [key, value] of Object.entries(updates)) {
    if (key === 'id') continue;
    const valKey = `:v${idx}`;
    const nameKey = `#n${idx}`;
    setExpressions.push(`${nameKey} = ${valKey}`);
    values[valKey] = value;
    names[nameKey] = key;
    idx++;
  }
  // always update updatedAt
  setExpressions.push('#updatedAt = :updatedAt');
  names['#updatedAt'] = 'updatedAt';
  values[':updatedAt'] = new Date().toISOString();

  return { expression: `SET ${setExpressions.join(', ')}`, values, names };
}

export function repoKey(repoId: string): { PK: string; SK: string } {
  return { PK: PK.repo(repoId), SK: SK.metadata };
}
