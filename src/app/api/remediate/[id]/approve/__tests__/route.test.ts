import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock auth
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock DB
vi.mock('@/lib/db/remediation', () => ({
  getRemediation: vi.fn(),
  updateRemediation: vi.fn(),
}));

vi.mock('@/lib/db/repositories', () => ({
  getRepository: vi.fn(),
}));

vi.mock('@/lib/db/users', () => ({
  getUser: vi.fn(),
}));

// Mock SQS with shared mock function
const mockSendFn = vi.fn().mockResolvedValue({});
vi.mock('@aws-sdk/client-sqs', () => {
  return {
    SQSClient: class {
      send = (...args: any[]) => (globalThis as any).__mockSendFn(...args);
    },
    SendMessageCommand: class {
      constructor(public input: any) {}
    },
  };
});

// Mock SST Resource
vi.mock('sst', () => ({
  Resource: {
    RemediationQueue: { url: 'https://sqs.test/queue' },
  },
}));

import { auth } from '@/lib/auth';
import { getRemediation, updateRemediation } from '@/lib/db/remediation';
import { getRepository } from '@/lib/db/repositories';

describe('POST /api/remediate/[id]/approve', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockSendFn = mockSendFn;
  });

  function makeRequest() {
    return new NextRequest('http://localhost/api/remediate/rem-1/approve', {
      method: 'POST',
    });
  }

  it('should return 401 if not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await POST(makeRequest(), {
      params: Promise.resolve({ id: 'rem-1' }),
    });

    expect(res.status).toBe(401);
  });

  it('should return 404 if remediation not found', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);
    vi.mocked(getRemediation).mockResolvedValue(null);

    const res = await POST(makeRequest(), {
      params: Promise.resolve({ id: 'rem-1' }),
    });

    expect(res.status).toBe(404);
  });

  it('should return 403 if user does not own the remediation', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);
    vi.mocked(getRemediation).mockResolvedValue({
      id: 'rem-1',
      repoId: 'repo-1',
      userId: 'other-user',
    } as any);
    vi.mocked(getRepository).mockResolvedValue({
      id: 'repo-1',
    } as any);

    const res = await POST(makeRequest(), {
      params: Promise.resolve({ id: 'rem-1' }),
    });

    expect(res.status).toBe(403);
  });

  it('should update status and send SQS message on approval', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', accessToken: 'ghp_test' },
    } as any);
    vi.mocked(getRemediation).mockResolvedValue({
      id: 'rem-1',
      repoId: 'repo-1',
      userId: 'user-1',
    } as any);
    vi.mocked(getRepository).mockResolvedValue({
      id: 'repo-1',
    } as any);

    const res = await POST(makeRequest(), {
      params: Promise.resolve({ id: 'rem-1' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify status was updated to approved
    expect(updateRemediation).toHaveBeenCalledWith('rem-1', {
      status: 'approved',
      agentStatus: 'Human approved. Starting refactor agent...',
    });

    // Verify SQS message was sent
    expect(mockSendFn).toHaveBeenCalledTimes(1);
    const command = mockSendFn.mock.calls[0][0];
    expect(command.input.QueueUrl).toBe('https://sqs.test/queue');

    const body = JSON.parse(command.input.MessageBody);
    expect(body.remediationId).toBe('rem-1');
    expect(body.repoId).toBe('repo-1');
    expect(body.userId).toBe('user-1');
    expect(body.type).toBe('swarm');
  });

  it('should return 404 if repository not found', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);
    vi.mocked(getRemediation).mockResolvedValue({
      id: 'rem-1',
      repoId: 'repo-1',
      userId: 'user-1',
    } as any);
    vi.mocked(getRepository).mockResolvedValue(null);

    const res = await POST(makeRequest(), {
      params: Promise.resolve({ id: 'rem-1' }),
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe('Repository not found');
  });
});
