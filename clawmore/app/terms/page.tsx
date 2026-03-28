import { Metadata } from 'next';
import LegalPage from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service | ClawMore',
  description:
    'Terms of Service for the ClawMore managed infrastructure platform.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="March 28, 2026">
      <h2>1. Acceptance of Terms</h2>
      <p>
        By creating an account or using ClawMore, you agree to these Terms of
        Service. If you are using ClawMore on behalf of an organization, you
        represent that you have authority to bind that organization to these
        terms.
      </p>

      <h2>2. Service Description</h2>
      <p>
        ClawMore provides a managed cloud infrastructure platform that includes:
      </p>
      <ul>
        <li>Automated code analysis and AI-powered improvement suggestions</li>
        <li>Managed AWS infrastructure provisioning and monitoring</li>
        <li>CI/CD integration for automated code fixes</li>
        <li>
          A web dashboard for tracking code quality and infrastructure health
        </li>
      </ul>

      <h2>3. Account Registration</h2>
      <p>
        You must provide accurate, complete information when creating an
        account. You are responsible for maintaining the security of your
        account credentials and for all activity under your account.
      </p>

      <h2>4. Subscription and Billing</h2>
      <p>
        ClawMore offers free and paid subscription plans. Paid plans are billed
        monthly via Stripe. You may cancel your subscription at any time through
        your account dashboard. Refunds are available within 14 days of initial
        subscription.
      </p>
      <p>
        AI credit packs are non-refundable once purchased. Unused credits do not
        expire but are forfeited upon account deletion.
      </p>

      <h2>5. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          Use the service to process illegal, harmful, or infringing content
        </li>
        <li>
          Attempt to reverse-engineer, decompile, or extract source code from
          the platform
        </li>
        <li>Share your account credentials with unauthorized third parties</li>
        <li>Exceed rate limits or attempt to circumvent usage restrictions</li>
        <li>
          Use the service to mine cryptocurrency or perform resource-intensive
          operations unrelated to its intended purpose
        </li>
      </ul>

      <h2>6. Data and Privacy</h2>
      <p>
        Your code and data remain your property. ClawMore processes your code to
        provide analysis and improvement suggestions. We do not store your
        source code beyond what is necessary to deliver the service. See our
        Privacy Policy for details.
      </p>

      <h2>7. Intellectual Property</h2>
      <p>
        ClawMore and its original content, features, and functionality are owned
        by the ClawMore team and are protected by international copyright,
        trademark, patent, trade secret, and other intellectual property laws.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        ClawMore is provided &ldquo;as is&rdquo; without warranties of any kind.
        We are not liable for any indirect, incidental, special, consequential,
        or punitive damages arising from your use of the service. Our total
        liability is limited to the amount you paid in the 12 months prior to
        the claim.
      </p>

      <h2>9. Service Availability</h2>
      <p>
        We strive for 99.9% uptime but do not guarantee uninterrupted access.
        Scheduled maintenance will be communicated in advance when possible.
      </p>

      <h2>10. Termination</h2>
      <p>
        We may suspend or terminate your account for violations of these terms.
        You may terminate your account at any time. Upon termination, your data
        will be retained for 30 days before permanent deletion.
      </p>

      <h2>11. Changes to Terms</h2>
      <p>
        We may update these terms from time to time. Material changes will be
        communicated via email at least 30 days before taking effect. Continued
        use of the service after changes constitutes acceptance.
      </p>

      <h2>12. Contact</h2>
      <p>
        For questions about these terms, contact us at{' '}
        <a href="mailto:legal@getaiready.dev">legal@getaiready.dev</a>.
      </p>
    </LegalPage>
  );
}
