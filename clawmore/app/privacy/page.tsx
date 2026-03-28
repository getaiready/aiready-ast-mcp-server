import { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy | ClawMore',
  description:
    'Privacy Policy for the ClawMore managed infrastructure platform.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="March 28, 2026">
      <h2>1. Information We Collect</h2>
      <p>We collect the following types of information:</p>
      <ul>
        <li>
          <strong>Account information:</strong> Email address, name, and billing
          details provided during registration and subscription.
        </li>
        <li>
          <strong>Usage data:</strong> Scan counts, repository metadata (names,
          not contents), and dashboard interactions to improve the service.
        </li>
        <li>
          <strong>Infrastructure data:</strong> AWS account IDs, cost metrics,
          and resource configurations necessary for managed platform operations.
        </li>
      </ul>

      <h2>2. How We Use Your Information</h2>
      <p>We use your information to:</p>
      <ul>
        <li>Provide and maintain the ClawMore platform</li>
        <li>Process payments and manage subscriptions via Stripe</li>
        <li>Send transactional emails (account approval, billing alerts)</li>
        <li>Analyze usage patterns to improve the service</li>
        <li>Detect and prevent fraud or abuse</li>
      </ul>

      <h2>3. Data Storage and Security</h2>
      <p>
        Your data is stored in AWS DynamoDB within the ap-southeast-2 (Sydney)
        region. We use industry-standard encryption for data at rest and in
        transit (TLS 1.2+). Access to production data is restricted to
        authorized personnel via IAM roles with least-privilege permissions.
      </p>

      <h2>4. Your Code</h2>
      <p>
        ClawMore does not store your source code. Code analysis is performed
        in-memory during scan execution and is not persisted after the scan
        completes. Only metadata about findings (file paths, line numbers, issue
        types) is retained.
      </p>

      <h2>5. Third-Party Services</h2>
      <p>We share limited data with these service providers:</p>
      <ul>
        <li>
          <strong>Stripe:</strong> Payment processing and subscription
          management. Governed by{' '}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Stripe&apos;s Privacy Policy
          </a>
          .
        </li>
        <li>
          <strong>Amazon Web Services:</strong> Infrastructure hosting and email
          delivery (SES). Governed by{' '}
          <a
            href="https://aws.amazon.com/privacy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            AWS Privacy
          </a>
          .
        </li>
        <li>
          <strong>Sentry:</strong> Error tracking and performance monitoring.
          Governed by{' '}
          <a
            href="https://sentry.io/privacy/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sentry&apos;s Privacy Policy
          </a>
          .
        </li>
      </ul>

      <h2>6. Data Retention</h2>
      <p>
        Account data is retained for the lifetime of your account plus 30 days
        after deletion. Billing records are retained for 7 years as required by
        tax regulations. Error logs are retained for 90 days.
      </p>

      <h2>7. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data via the account dashboard</li>
        <li>Request data export by contacting support</li>
        <li>Request deletion of your account and associated data</li>
        <li>Opt out of non-essential communications</li>
      </ul>

      <h2>8. Cookies</h2>
      <p>
        ClawMore uses essential cookies for authentication (session management)
        and locale preferences. We do not use advertising or tracking cookies.
      </p>

      <h2>9. Children&apos;s Privacy</h2>
      <p>
        ClawMore is not intended for users under 16 years of age. We do not
        knowingly collect personal information from children.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        We may update this privacy policy from time to time. Material changes
        will be communicated via email at least 30 days before taking effect.
      </p>

      <h2>11. Contact</h2>
      <p>
        For privacy-related inquiries, contact us at{' '}
        <a href="mailto:privacy@getaiready.dev">privacy@getaiready.dev</a>.
      </p>
    </LegalPage>
  );
}
