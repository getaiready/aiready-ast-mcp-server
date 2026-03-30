import { SQSEvent } from 'aws-lambda';
import {
  getAnalysis,
  calculateAiScore,
  extractBreakdown,
  extractSummary,
} from '../lib/storage';
import { updateAnalysisStatus, saveMetricPoints, getUser } from '../lib/db';
import { getRepository } from '../lib/db/repositories';
import { sendAnalysisCompleteEmail } from '../lib/email';

export async function handler(event: SQSEvent) {
  for (const record of event.Records) {
    try {
      const bridgeEvent = JSON.parse(record.body);
      const { analysisId, repoId, userId, rawKey, timestamp } =
        bridgeEvent.detail;

      console.log(
        `[AnalysisProcessor] Processing analysis ${analysisId} for repo ${repoId}`
      );

      // 1. Fetch raw data from S3
      const data = await getAnalysis(rawKey);
      if (!data) {
        throw new Error(
          `Failed to fetch analysis data from S3 for key: ${rawKey}`
        );
      }

      // 2. Extract metrics and calculate score
      const aiScore = data.summary?.aiReadinessScore || calculateAiScore(data);
      const breakdown = extractBreakdown(data);
      const summary = extractSummary(data);
      const commitHash = data.metadata?.commit;

      // 3. Update Analysis record to 'completed'
      await updateAnalysisStatus({
        repoId,
        timestamp,
        status: 'completed',
        aiScore,
        breakdown,
        summary,
        commitHash,
      });

      // 4. Save time-series metrics for historical trending
      const metricsToStore: Record<string, number> = {
        aiReadinessScore: aiScore,
        ...breakdown,
      };

      await saveMetricPoints({
        repoId,
        timestamp,
        metrics: metricsToStore,
        runId: analysisId,
      });

      // 5. Send email notification
      const [user, repo] = await Promise.all([
        getUser(userId),
        getRepository(repoId),
      ]);

      if (user?.email && repo) {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL || 'https://platform.getaiready.dev';
        await sendAnalysisCompleteEmail({
          to: user.email,
          repoName: repo.name,
          aiScore,
          breakdown,
          summary,
          dashboardUrl: `${baseUrl}/dashboard?repo=${repoId}`,
        });
      }

      console.log(
        `[AnalysisProcessor] Successfully processed analysis ${analysisId}`
      );
    } catch (error) {
      console.error(`[AnalysisProcessor] Error processing record:`, error);
      // We should potentially update the analysis status to 'failed' here
      try {
        const bridgeEvent = JSON.parse(record.body);
        const { repoId, timestamp } = bridgeEvent.detail;
        if (repoId && timestamp) {
          await updateAnalysisStatus({
            repoId,
            timestamp,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      } catch (dbError) {
        console.error(
          `[AnalysisProcessor] Failed to update failure status:`,
          dbError
        );
      }
    }
  }
}
