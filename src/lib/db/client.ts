import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-southeast-2',
});

export const doc = DynamoDBDocumentClient.from(client, {
  marshallOptions: { convertEmptyValues: true, removeUndefinedValues: true },
  unmarshallOptions: { wrapNumbers: false },
});

// Cached table name - evaluated once at module load time
// Use this instead of calling getTableName() in every function
export const TABLE_NAME = process.env.DYNAMO_TABLE || 'aiready-platform';

export const getTableName = () => TABLE_NAME;
