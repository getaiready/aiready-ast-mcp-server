'use client';

import { useRouter } from 'next/navigation';
import { ScanConfigForm } from '../dashboard/repo/[id]/settings/ScanConfigForm';
import { updateScanStrategy } from '@/lib/scan-strategy';
import { SettingsIcon } from '@/components/Icons';
import { Team, TeamMember } from '@/lib/db';

interface Props {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    scanConfig?: any;
  };
  teams: (TeamMember & { team: Team })[];
  overallScore: number | null;
}

export default function StrategyClient({
  user,
  teams: _teams,
  overallScore: _overallScore,
}: Props) {
  const router = useRouter();

  async function handleUpdateScanStrategy(settings: any | null) {
    await updateScanStrategy(settings, () => router.refresh());
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <SettingsIcon className="w-6 h-6 text-cyan-500" />
          </div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
            Global Strategy
          </h1>
        </div>
        <p className="text-slate-400">
          Set the baseline AI-readiness standards for your entire workspace.
          These settings auto-apply to all repositories unless overridden
          individually.
        </p>
      </div>

      <section className="space-y-6">
        <ScanConfigForm
          repoId="global"
          initialSettings={user.scanConfig || null}
          fileCount={0}
          lastExecutionTime={0}
          lastSettings={null}
          onSave={handleUpdateScanStrategy}
        />
      </section>
    </div>
  );
}
