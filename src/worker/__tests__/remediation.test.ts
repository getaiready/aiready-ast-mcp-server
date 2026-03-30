import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../remediation';

// Mock AWS Lambda types
vi.mock('aws-lambda', () => ({
  /* SQSEvent type only, no runtime needed */
}));

// Mock DB modules
vi.mock('../../lib/db/remediation', () => ({
  getRemediation: vi.fn(),
  updateRemediation: vi.fn(),
}));

vi.mock('../../lib/db/repositories', () => ({
  getRepository: vi.fn(),
}));

vi.mock('../../lib/db/users', () => ({
  getUser: vi.fn(),
}));

vi.mock('../../lib/email', () => ({
  sendRemediationNotificationEmail: vi
    .fn()
    .mockResolvedValue({ success: true }),
}));

// Mock the agents package
vi.mock('@aiready/agents', () => ({
  RemediationSwarm: {
    execute: vi.fn(),
  },
}));

// Mock isomorphic-git
vi.mock('isomorphic-git', () => ({
  clone: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('isomorphic-git/http/node', () => ({
  default: {},
}));

// Mock fs for cleanup
vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true),
  rmSync: vi.fn(),
}));

import { getRemediation, updateRemediation } from '../../lib/db/remediation';
import { getRepository } from '../../lib/db/repositories';
import { getUser } from '../../lib/db/users';
import { sendRemediationNotificationEmail } from '../../lib/email';
import { RemediationSwarm } from '@aiready/agents';

function makeSQSEvent(body: object) {
  return {
    Records: [
      {
        body: JSON.stringify(body),
        messageId: 'msg-1',
        receiptHandle: 'rh-1',
        attributes: {} as any,
        messageAttributes: {},
        md5OfBody: '',
        eventSource: '',
        eventSourceARN: '',
        awsRegion: '',
      },
    ],
  };
}

describe('RemediationWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MINIMAX_API_KEY = 'test-mm-key';
    process.env.NEXT_PUBLIC_APP_URL = 'https://platform.getaiready.dev';
  });

  it('should skip records with missing required fields', async () => {
    const event = makeSQSEvent({ remediationId: 'rem-1' }); // missing repoId and userId

    await handler(event as any);

    expect(getRemediation).not.toHaveBeenCalled();
    expect(updateRemediation).not.toHaveBeenCalled();
  });

  it('should fail fast if no LLM API key is configured', async () => {
    delete process.env.MINIMAX_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const event = makeSQSEvent({
      remediationId: 'rem-1',
      repoId: 'repo-1',
      userId: 'user-1',
    });

    await handler(event as any);

    expect(updateRemediation).toHaveBeenCalledWith('rem-1', {
      status: 'failed',
      agentStatus: 'Error: LLM API key not configured. Contact support.',
    });
    expect(RemediationSwarm.execute).not.toHaveBeenCalled();
  });

  it('should process a standard remediation end-to-end', async () => {
    vi.mocked(getRemediation).mockResolvedValue({
      id: 'rem-1',
      repoId: 'repo-1',
      userId: 'user-1',
      type: 'consolidation',
      risk: 'low',
      status: 'approved',
      title: 'Fix duplicate auth logic',
      description: 'Duplicate auth logic in login.ts and register.ts',
      affectedFiles: ['login.ts', 'register.ts'],
      estimatedSavings: 500,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } as any);

    vi.mocked(getRepository).mockResolvedValue({
      id: 'repo-1',
      userId: 'user-1',
      name: 'my-app',
      url: 'https://github.com/test/my-app',
      defaultBranch: 'main',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } as any);

    vi.mocked(getUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      name: 'Test User',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } as any);

    vi.mocked(RemediationSwarm.execute).mockResolvedValue({
      ok: true,
      value: {
        status: 'success',
        diff: '--- a/login.ts\n+++ b/login.ts',
        prUrl: 'https://github.com/test/my-app/pull/42',
        prNumber: 42,
        explanation: 'Consolidated duplicate auth logic',
      },
    });

    const event = makeSQSEvent({
      remediationId: 'rem-1',
      repoId: 'repo-1',
      userId: 'user-1',
      accessToken: 'ghp_test',
      type: 'swarm',
    });

    await handler(event as any);

    // Verify status transitions
    expect(updateRemediation).toHaveBeenCalledWith('rem-1', {
      status: 'in-progress',
      agentStatus: 'Initializing workspace and cloning repository...',
    });

    expect(updateRemediation).toHaveBeenCalledWith('rem-1', {
      agentStatus:
        'Remediation Swarm active: Researching issue and planning fix...',
    });

    expect(updateRemediation).toHaveBeenCalledWith(
      'rem-1',
      expect.objectContaining({
        status: 'reviewing',
        agentStatus: 'Remediation complete. PR created for Expert Review.',
        suggestedDiff: '--- a/login.ts\n+++ b/login.ts',
        prUrl: 'https://github.com/test/my-app/pull/42',
        prNumber: 42,
      })
    );

    // Verify email notification was sent
    expect(sendRemediationNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@test.com',
        repoName: 'my-app',
        status: 'reviewing',
        prUrl: 'https://github.com/test/my-app/pull/42',
      })
    );
  });

  it('should pass expert feedback to the swarm', async () => {
    vi.mocked(getRemediation).mockResolvedValue({
      id: 'rem-2',
      repoId: 'repo-1',
      userId: 'user-1',
      type: 'rename',
      risk: 'low',
      status: 'in-progress',
      title: 'Rename util',
      description: 'Rename',
      affectedFiles: ['util.ts'],
      estimatedSavings: 100,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } as any);

    vi.mocked(getRepository).mockResolvedValue({
      id: 'repo-1',
      userId: 'user-1',
      name: 'my-app',
      url: 'https://github.com/test/my-app',
      defaultBranch: 'main',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } as any);

    vi.mocked(getUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } as any);

    vi.mocked(RemediationSwarm.execute).mockResolvedValue({
      ok: true,
      value: {
        status: 'success',
        diff: 'revised diff',
        prUrl: 'https://github.com/test/my-app/pull/43',
        prNumber: 43,
        explanation: 'Revised',
      },
    });

    const event = makeSQSEvent({
      remediationId: 'rem-2',
      repoId: 'repo-1',
      userId: 'user-1',
      accessToken: 'ghp_test',
      type: 'swarm',
      expertFeedback: 'Also update the test file please',
      previousDiff: '--- old diff',
    });

    await handler(event as any);

    // Verify expert feedback was passed through to the swarm
    expect(RemediationSwarm.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          expertFeedback: 'Also update the test file please',
          previousDiff: '--- old diff',
        }),
      })
    );
  });

  it('should handle swarm failure gracefully', async () => {
    vi.mocked(getRemediation).mockResolvedValue({
      id: 'rem-3',
      repoId: 'repo-1',
      userId: 'user-1',
      type: 'consolidation',
      risk: 'low',
      status: 'approved',
      title: 'Fix',
      description: 'Fix',
      affectedFiles: [],
      estimatedSavings: 0,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } as any);

    vi.mocked(getRepository).mockResolvedValue({
      id: 'repo-1',
      userId: 'user-1',
      name: 'my-app',
      url: 'https://github.com/test/my-app',
      defaultBranch: 'main',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } as any);

    vi.mocked(getUser).mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    } as any);

    vi.mocked(RemediationSwarm.execute).mockResolvedValue({
      ok: false,
      error: 'Agent crashed due to invalid API key',
    });

    const event = makeSQSEvent({
      remediationId: 'rem-3',
      repoId: 'repo-1',
      userId: 'user-1',
      accessToken: 'ghp_test',
    });

    await handler(event as any);

    expect(updateRemediation).toHaveBeenCalledWith('rem-3', {
      status: 'failed',
      agentStatus: 'Error: Agent crashed due to invalid API key',
    });

    expect(sendRemediationNotificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        error: 'Agent crashed due to invalid API key',
      })
    );
  });

  it('should handle missing remediation in DB', async () => {
    vi.mocked(getRemediation).mockResolvedValue(null);
    vi.mocked(getRepository).mockResolvedValue(null);

    const event = makeSQSEvent({
      remediationId: 'rem-missing',
      repoId: 'repo-missing',
      userId: 'user-1',
    });

    await handler(event as any);

    // Should skip without crashing
    expect(updateRemediation).not.toHaveBeenCalled();
    expect(RemediationSwarm.execute).not.toHaveBeenCalled();
  });
});
