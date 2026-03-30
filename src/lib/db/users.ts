import {
  putItem,
  getItem,
  queryItems,
  updateItem,
  PK,
  SK,
  GSI,
  buildUpdateExpression,
} from './helpers';
import type { User } from './types';

export async function createUser(user: User): Promise<User> {
  const now = new Date().toISOString();
  const item = {
    PK: PK.user(user.id),
    SK: SK.metadata,
    GSI1PK: GSI.users.pk,
    GSI1SK: user.email,
    ...user,
    createdAt: user.createdAt || now,
    updatedAt: now,
  };
  await putItem(item);
  return user;
}

export async function getUser(userId: string): Promise<User | null> {
  return getItem<User>({ PK: PK.user(userId), SK: SK.metadata });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const items = await queryItems<User>({
    IndexName: GSI.users.index,
    KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :email',
    ExpressionAttributeValues: { ':pk': GSI.users.pk, ':email': email },
  });
  return items[0] || null;
}

export async function updateUser(
  userId: string,
  updates: Partial<User>
): Promise<void> {
  const update = buildUpdateExpression(updates);
  if (!update) return;
  await updateItem(
    { PK: PK.user(userId), SK: SK.metadata },
    update.expression,
    update.values,
    update.names
  );
}
