import { Metadata } from 'next';
import { auth } from '@/lib/auth';
import {
  getUserByEmail,
  listUserRepositories,
  listUserTeams,
  Team,
  TeamMember,
} from '@/lib/db';
import MetricsClient from './MetricsClient';

export const metadata: Metadata = {
  title: 'AI Readiness Metrics & Methodology',
  description:
    'Deep dive into the 9 core metrics of AI-readiness: Semantic Duplicates, Context Fragmentation, Naming Consistency, and more. Learn how we measure and improve your codebase for AI collaboration.',
  keywords: [
    'AI readiness methodology',
    'codebase metrics',
    'AI scoring thresholds',
    'developer productivity',
    'semantic duplication',
  ],
};

export default async function MetricsPage() {
  const session = await auth();

  let user = null;
  let teams: (TeamMember & { team: Team })[] = [];
  let overallScore = null;

  if (session?.user?.email) {
    user = await getUserByEmail(session.user.email);
    if (user) {
      const repos = await listUserRepositories(user.id);
      teams = await listUserTeams(user.id);

      // Calculate overall AI score
      const reposWithScores = repos.filter(
        (r) => r.aiScore !== null && r.aiScore !== undefined
      );
      overallScore =
        reposWithScores.length > 0
          ? Math.round(
              reposWithScores.reduce((sum, r) => sum + (r.aiScore || 0), 0) /
                reposWithScores.length
            )
          : null;
    }
  }

  return (
    <MetricsClient
      user={
        user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
            }
          : null
      }
      teams={teams}
      overallScore={overallScore}
    />
  );
}
