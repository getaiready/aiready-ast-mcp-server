import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserByEmail,
  createUser,
  listUserTeams,
  listUserRepositories,
} from '@/lib/db';
import StrategyClient from './StrategyClient';

export default async function GlobalStrategyPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  let user;
  try {
    user = await getUserByEmail(session.user.email);
    if (!user) {
      user = await createUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || undefined,
        image: session.user.image || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Strategy page error:', error);
    user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    };
  }

  const teams = await listUserTeams(session.user.id);
  const userRepos = await listUserRepositories(session.user.id);

  // Calculate overall AI score for the sidebar
  const reposWithScores = userRepos.filter(
    (r) => r.aiScore !== null && r.aiScore !== undefined
  );
  const overallScore =
    reposWithScores.length > 0
      ? Math.round(
          reposWithScores.reduce((sum, r) => sum + (r.aiScore || 0), 0) /
            reposWithScores.length
        )
      : null;

  return (
    <StrategyClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        scanConfig: user.scanConfig,
      }}
      teams={teams}
      overallScore={overallScore}
    />
  );
}
