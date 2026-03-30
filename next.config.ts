import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

// Suppress AWS SDK warning when both profile and static keys are set
// by prioritizing the profile (which is the project standard)
if (
  process.env.AWS_PROFILE &&
  (process.env.AWS_ACCESS_KEY_ID || process.env.AWS_SECRET_ACCESS_KEY)
) {
  delete process.env.AWS_ACCESS_KEY_ID;
  delete process.env.AWS_SECRET_ACCESS_KEY;
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:8888'],
    },
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: 'aiready',
  project: 'platform',
});
