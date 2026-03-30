import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { doc, TABLE_NAME } from './client';
import {
  putItem,
  queryItems,
  PK,
  buildUpdateExpression,
  updateItem,
} from './helpers';
import type { Analysis } from './types';
import { updateRepositoryScore } from './repositories';

export async function createAnalysis(analysis: Analysis): Promise<Analysis> {
  const item = {
    PK: PK.analysis(analysis.repoId),
    SK: analysis.timestamp,
    GSI2PK: PK.analysis(analysis.repoId),
    GSI2SK: analysis.timestamp,
    ...analysis,
    createdAt: analysis.createdAt || new Date().toISOString(),
  };

  await putItem(item);

  // Only update repository score if analysis is completed
  if (analysis.status === 'completed') {
    await updateRepositoryScore(analysis.repoId, analysis.aiScore);
  }

  return analysis;
}

export async function listRepositoryAnalyses(
  repoId: string,
  limit = 20
): Promise<Analysis[]> {
  return queryItems<Analysis>({
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': PK.analysis(repoId) },
    ScanIndexForward: false,
    Limit: limit,
  });
}

export async function getLatestAnalysis(
  repoId: string,
  includeIncomplete = false
): Promise<Analysis | null> {
  const items = await queryItems<Analysis>({
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': PK.analysis(repoId) },
    ScanIndexForward: false,
    Limit: 10,
  });

  if (includeIncomplete) {
    return items[0] || null;
  }

  return items.find((a) => a.status === 'completed') || items[0] || null;
}

export async function updateAnalysisStatus(params: {
  repoId: string;
  timestamp: string;
  status: 'completed' | 'failed';
  aiScore?: number;
  breakdown?: any;
  summary?: any;
  error?: string;
  commitHash?: string;
}): Promise<void> {
  const filtered: Record<string, unknown> = {};
  filtered.status = params.status;
  filtered.aiScore = params.aiScore || 0;
  filtered.breakdown = params.breakdown || {};
  filtered.summary = params.summary || {};
  filtered.error = params.error || null;

  const expr = buildUpdateExpression(filtered);
  if (!expr) return;

  await updateItem(
    { PK: `ANALYSIS#${params.repoId}`, SK: params.timestamp },
    expr.expression,
    expr.values,
    expr.names
  );

  if (params.status === 'completed' && params.aiScore !== undefined) {
    await updateRepositoryScore(
      params.repoId,
      params.aiScore,
      params.commitHash
    );
  }
}

export async function saveMetricPoints(params: {
  repoId: string;
  timestamp: string;
  metrics: Record<string, number>;
  runId: string;
}): Promise<void> {
  const promises = Object.entries(params.metrics).map(([type, value]) => {
    return doc.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `REPO#${params.repoId}`,
          SK: `METRIC#${type}#${params.timestamp}`,
          type,
          value,
          runId: params.runId,
          timestamp: params.timestamp,
          GSI3PK: `METRIC#${type}`,
          GSI3SK: params.timestamp,
          GSI4PK: `METRIC#${params.repoId}#${type}`,
          GSI4SK: params.timestamp,
        },
      })
    );
  });

  await Promise.all(promises);
}

export async function getRepositoryMetrics(params: {
  repoId: string;
  metricType?: string;
  limit?: number;
}): Promise<any[]> {
  const result = await doc.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :prefix)',
      ExpressionAttributeValues: {
        ':pk': `REPO#${params.repoId}`,
        ':prefix': params.metricType
          ? `METRIC#${params.metricType}#`
          : 'METRIC#',
      },
      ScanIndexForward: true, // Chronological order
      Limit: params.limit || 100,
    })
  );
  return result.Items || [];
}
