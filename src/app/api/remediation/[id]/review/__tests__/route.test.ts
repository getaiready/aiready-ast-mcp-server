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

// Mock SQS with shared mock function via globalThis
const mockSendFn = vi.fn().mockResolvedValue({});
vi.mock('@aws-sdk/client-sqs', () => {
  return {
    SQSClient: class {
      send = (...args: any[]) =>
        (globalThis as any).__mockSendFnReview(...args);
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

describe('POST /api/remediation/[id]/review', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__mockSendFnReview = mockSendFn;
  });

  function makeRequest(body: any) {
    return new NextRequest('http://localhost/api/remediation/rem-1/review', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  it('should return 401 if not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const res = await POST(
      makeRequest({ decision: 'approve', comment: 'LGTM' }),
      {
        params: Promise.resolve({ id: 'rem-1' }),
      }
    );

    expect(res.status).toBe(401);
  });

  it('should return 400 if decision is missing', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);

    const res = await POST(makeRequest({ comment: 'no decision' }), {
      params: Promise.resolve({ id: 'rem-1' }),
    });

    expect(res.status).toBe(400);
  });

  it('should return 404 if remediation not found', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1' },
    } as any);
    vi.mocked(getRemediation).mockResolvedValue(null);

    const res = await POST(
      makeRequest({ decision: 'approve', comment: 'LGTM' }),
      {
        params: Promise.resolve({ id: 'rem-1' }),
      }
    );

    expect(res.status).toBe(404);
  });

  it('should send SQS message on expert approve', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', accessToken: 'ghp_test' },
    } as any);
    vi.mocked(getRemediation).mockResolvedValue({
      id: 'rem-1',
      repoId: 'repo-1',
      userId: 'creator-1',
      suggestedDiff: '--- a/file.ts',
    } as any);

    const res = await POST(
      makeRequest({ decision: 'approve', comment: 'Looks good, merge it' }),
      { params: Promise.resolve({ id: 'rem-1' }) }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe('approved');

    // Verify status update
    expect(updateRemediation).toHaveBeenCalledWith('rem-1', {
      status: 'approved',
      agentStatus: 'Expert approved. Starting refactor agent...',
      reviewFeedback: expect.objectContaining({
        comment: 'Looks good, merge it',
        decision: 'approve',
      }),
    });

    // Verify SQS message sent
    expect(mockSendFn).toHaveBeenCalledTimes(1);
    const command = mockSendFn.mock.calls[0][0];
    const body = JSON.parse(command.input.MessageBody);
    expect(body.remediationId).toBe('rem-1');
    expect(body.type).toBe('swarm');
    expect(body.expertFeedback).toBeUndefined(); // no feedback on approve
  });

  it('should send SQS message with expert feedback on request-changes', async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user-1', accessToken: 'ghp_test' },
    } as any);
    vi.mocked(getRemediation).mockResolvedValue({
      id: 'rem-1',
      repoId: 'repo-1',
      userId: 'creator-1',
      suggestedDiff: '--- a/file.ts\n+++ b/file.ts\n-old\n+new',
    } as any);

    const res = await POST(
      makeRequest({
        decision: 'request-changes',
        comment: 'Also update the test file for this change',
      }),
      { params: Promise.resolve({ id: 'rem-1' }) }
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.status).toBe('in-progress');

    // Verify status update
    expect(updateRemediation).toHaveBeenCalledWith('rem-1', {
      status: 'in-progress',
      agentStatus: expect.stringContaining('Expert requested changes'),
      reviewFeedback: expect.objectContaining({
        comment: 'Also update the test file for this change',
        decision: 'request-changes',
      }),
    });

    // Verify SQS message includes expert feedback and previous diff
    expect(mockSendFn).toHaveBeenCalledTimes(1);
    const command = mockSendFn.mock.calls[0][0];
    const body = JSON.parse(command.input.MessageBody);
    expect(body.remediationId).toBe('rem-1');
    expect(body.expertFeedback).toBe(
      'Also update the test file for this change'
    );
    expect(body.previousDiff).toBe('--- a/file.ts\n+++ b/file.ts\n-old\n+new');
  });
});
