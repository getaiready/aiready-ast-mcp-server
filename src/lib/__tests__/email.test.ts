import { describe, it, expect, vi } from 'vitest';
import { sendEmail, sendWelcomeEmail } from '../email';

vi.mock('@aws-sdk/client-ses', () => {
  return {
    SESClient: class {
      send = vi.fn().mockResolvedValue({ MessageId: 'test-id' });
    },
    SendEmailCommand: class {},
  };
});

describe('Email Utilities', () => {
  it('should send a general email', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test',
      htmlBody: '<p>Hello</p>',
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('test-id');
  });

  it('should send a welcome email', async () => {
    const result = await sendWelcomeEmail({
      to: 'new@example.com',
      name: 'New User',
    });

    expect(result.success).toBe(true);
  });
});
