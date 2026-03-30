import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserByEmail, listUserRepositories, listUserTeams } from '@/lib/db';
import TrendsExplorer from '@/components/TrendsExplorer';
import _PlatformShell from '@/components/PlatformShell';

export default async function TrendsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await getUserByEmail(session.user.email);
  if (!user) redirect('/login');

  const repos = await listUserRepositories(user.id);
  const _teams = await listUserTeams(user.id);

  // Calculate overall AI score
  const reposWithScores = repos.filter(
    (r) => r.aiScore !== null && r.aiScore !== undefined
  );
  const _overallScore =
    reposWithScores.length > 0
      ? Math.round(
          reposWithScores.reduce((sum, r) => sum + (r.aiScore || 0), 0) /
            reposWithScores.length
        )
      : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <TrendsExplorer repos={repos} />
    </div>
  );
}
