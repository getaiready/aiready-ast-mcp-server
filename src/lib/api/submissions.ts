import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { sendEmail } from '@/lib/email';

const bucket = process.env.SUBMISSIONS_BUCKET;
const s3 = new S3Client({});
const sesToEmail = process.env.SES_TO_EMAIL || 'team@getaiready.dev';

interface SubmissionOptions {
  keyPrefix: string;
  payload: Record<string, unknown>;
  emailSubject: string;
  emailHtmlBody: string;
  errorContext: string;
}

/**
 * Stores a submission in S3 and sends an email notification.
 * This is a shared utility to reduce code duplication across API routes.
 */
export async function storeSubmissionAndNotify(
  options: SubmissionOptions
): Promise<NextResponse> {
  const { keyPrefix, payload, emailSubject, emailHtmlBody, errorContext } =
    options;

  try {
    if (!bucket) {
      console.error('SUBMISSIONS_BUCKET environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const now = new Date();
    const id = `${now.toISOString()}_${Math.random().toString(36).slice(2, 8)}`;
    const key = `${keyPrefix}/${id}.json`;

    // Store in S3
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(payload, null, 2),
        ContentType: 'application/json',
      })
    );

    // Notify via SES
    await sendEmail({
      to: sesToEmail,
      subject: emailSubject,
      htmlBody: emailHtmlBody,
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Internal Server Error';
    console.error(`${errorContext} error:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
