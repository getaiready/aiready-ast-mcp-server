import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import {
  getUserByEmail,
  listUserRepositories,
  listUserTeams,
  createUser,
  Team,
  TeamMember,
} from '@/lib/db';
import PlatformShell from '@/components/PlatformShell';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  let user = await getUserByEmail(session.user.email);

  // Lazy creation for OAuth users if they don't exist in our DB yet
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

  // Fetch data needed for the shell
  const repos = await listUserRepositories(user.id);
  const teams = (await listUserTeams(user.id)) as (TeamMember & {
    team: Team;
  })[];

  // Calculate overall AI score (average of all repos) for the sidebar
  const reposWithScores = repos.filter(
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
    <PlatformShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }}
      teams={teams}
      overallScore={overallScore}
    >
      {children}
    </PlatformShell>
  );
}
