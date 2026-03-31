import { SQSEvent } from 'aws-lambda';
import * as fs from 'fs';
import * as path from 'path';
import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import { randomUUID } from 'crypto';
import { getRemediation, updateRemediation } from '../lib/db/remediation';
import { getRepository } from '../lib/db/repositories';
import { getUser } from '../lib/db/users';
import { sendRemediationNotificationEmail } from '../lib/email';
import { RemediationSwarm } from '@aiready/agents';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'https://platform.getaiready.dev';

const AGENT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Wrap a promise with a timeout.
 */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms}ms`)),
        ms
      )
    ),
  ]);
}

interface SQSMessageBody {
  remediationId: string;
  repoId: string;
  userId: string;
  accessToken?: string;
  type?: string;
  expertFeedback?: string;
  previousDiff?: string;
}

export async function handler(event: SQSEvent) {
  for (const record of event.Records) {
    const {
      remediationId,
      repoId,
      userId: _userId,
      accessToken,
      expertFeedback,
      previousDiff,
    } = JSON.parse(record.body) as SQSMessageBody;

    const userId = _userId;

    // Validate required fields
    if (!remediationId || !repoId || !userId) {
      console.error(
        `[RemediationWorker] Invalid SQS message: missing required fields`
      );
      continue;
    }

    // Validate LLM API key is configured before doing expensive work
    const apiKey = process.env.MINIMAX_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error(
        `[RemediationWorker] No LLM API key configured (MINIMAX_API_KEY or ANTHROPIC_API_KEY)`
      );
      await updateRemediation(remediationId, {
        status: 'failed',
        agentStatus: 'Error: LLM API key not configured. Contact support.',
      });
      continue;
    }

    console.log(
      `[RemediationWorker] Processing remediation ${remediationId} for repo ${repoId}${expertFeedback ? ' (with expert feedback)' : ''}`
    );

    const [remediation, repo, user] = await Promise.all([
      getRemediation(remediationId),
      getRepository(repoId),
      getUser(userId),
    ]);

    if (!remediation || !repo) {
      console.error(`[RemediationWorker] Remediation or Repo not found`);
      continue;
    }

    const tempDir = path.join('/tmp', `remedy-${randomUUID()}`);

    try {
      await updateRemediation(remediationId, {
        status: 'in-progress',
        agentStatus: 'Initializing workspace and cloning repository...',
      });

      console.log(`[RemediationWorker] Cloning ${repo.url} to ${tempDir}...`);

      await git.clone({
        fs,
        http,
        dir: tempDir,
        url: repo.url,
        singleBranch: true,
        depth: 1,
        onAuth: () => ({ username: accessToken || '', password: '' }),
      });

      await updateRemediation(remediationId, {
        agentStatus:
          'Remediation Swarm active: Researching issue and planning fix...',
      });

      // Execute the Mastra Workflow with timeout protection
      const executePromise = RemediationSwarm.execute({
        remediation,
        repo,
        rootDir: tempDir,
        config: {
          githubToken: accessToken,
          openaiApiKey: process.env.OPENAI_API_KEY,
          anthropicApiKey: process.env.MINIMAX_API_KEY,
          anthropicBaseUrl: 'https://api.minimax.io/anthropic/v1',
          model: process.env.MINIMAX_MODEL || 'MiniMax-M2.7',
          expertFeedback,
          previousDiff,
        },
      });

      console.log(
        `[RemediationWorker] Executing RemediationSwarm for ${remediationId}...`
      );
      const result = await withTimeout(
        executePromise,
        AGENT_TIMEOUT_MS,
        'RemediationSwarm.execute'
      );

      console.log(
        `[RemediationWorker] Workflow execution completed for ${remediationId}`
      );

      if (result.ok && result.value) {
        const { prUrl, prNumber, diff, status, reasoning } =
          result.value as any;

        if (status === 'failure') {
          throw new Error(
            result.value.explanation || 'Agent failed to refactor'
          );
        }

        await updateRemediation(remediationId, {
          status: 'reviewing',
          agentStatus: 'Remediation complete. PR created for Expert Review.',
          suggestedDiff: diff || 'Diff not provided',
          reasoning: reasoning || 'Reasoning not provided',
          prUrl: prUrl,
          prNumber: prNumber,
        });

        if (user?.email) {
          await sendRemediationNotificationEmail({
            to: user.email,
            repoName: repo.name,
            remediationTitle: remediation.title,
            status: 'reviewing',
            prUrl: prUrl,
            prNumber: prNumber,
            dashboardUrl: `${APP_URL}/dashboard/repo/${repo.id}`,
          });
        }
      } else {
        throw new Error(result.error || 'Workflow execution failed');
      }
    } catch (error) {
      console.error(
        `[RemediationWorker] Error processing remediation ${remediationId}:`,
        error
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown error during remediation';
      await updateRemediation(remediationId, {
        status: 'failed',
        agentStatus: `Error: ${errorMessage}`,
      });

      if (user?.email) {
        await sendRemediationNotificationEmail({
          to: user.email,
          repoName: repo.name,
          remediationTitle: remediation.title,
          status: 'failed',
          error: errorMessage,
          dashboardUrl: `${APP_URL}/dashboard/repo/${repo.id}`,
        });
      }
    } finally {
      // Cleanup temp directory
      try {
        if (fs.existsSync(tempDir)) {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        console.error(`[RemediationWorker] Cleanup error:`, cleanupError);
      }
    }
  }
}
