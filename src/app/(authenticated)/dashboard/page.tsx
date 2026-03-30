import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  listUserRepositories,
  getLatestAnalysis,
  getUserByEmail,
  createUser,
  listUserTeams,
} from '@/lib/db';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  let user;
  let repos: any[] = [];
  let teams: any[] = [];

  try {
    // Ensure user exists in our database (lazy creation for OAuth users)
    user = await getUserByEmail(session.user.email);

    if (!user) {
      console.log(
        `[Dashboard] Creating new user for ${session.user.email} with ID ${session.user.id}`
      );
      // Create user from session data
      // Use the session user ID (OAuth ID) instead of generating a new one
      // to maintain consistency with initial API calls
      user = await createUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || undefined,
        image: session.user.image || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      console.log(
        `[Dashboard] Found existing user ${user.email} with ID ${user.id} (Session ID: ${session.user.id})`
      );
      if (user.id !== session.user.id) {
        console.warn(
          `[Dashboard] WARNING: Session ID mismatch! Session: ${session.user.id}, DB: ${user.id}`
        );
      }
    }

    // Fetch user's repositories and teams
    repos = await listUserRepositories(user.id);
    teams = await listUserTeams(user.id);
  } catch (error) {
    console.error('Dashboard error:', error);
    // If there's a database error, still show dashboard with empty state
    user = {
      id: session.user.id || 'temp',
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    };
  }

  // Fetch latest analysis for each repo
  const reposWithAnalysis = await Promise.all(
    repos.map(async (repo) => {
      const latestAnalysis = await getLatestAnalysis(repo.id);
      return { ...repo, latestAnalysis };
    })
  );

  // Calculate overall AI score (average of all repos)
  const reposWithScores = reposWithAnalysis.filter(
    (r) => r.aiScore !== undefined
  );
  const overallScore =
    reposWithScores.length > 0
      ? Math.round(
          reposWithScores.reduce((sum, r) => sum + (r.aiScore || 0), 0) /
            reposWithScores.length
        )
      : null;

  return (
    <DashboardClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        githubId: user.githubId,
        googleId: user.googleId,
      }}
      repos={reposWithAnalysis}
      teams={teams}
      overallScore={overallScore}
    />
  );
}
