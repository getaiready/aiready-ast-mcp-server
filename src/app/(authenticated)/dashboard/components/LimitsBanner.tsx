'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Team, TeamMember } from '@/lib/db';

interface LimitsBannerProps {
  repoCount: number;
  currentTeamId: string | 'personal';
  teams: (TeamMember & { team: Team })[];
  analyzedRepoCount: number;
  billingLoading: boolean;
  onPortal: (customerId: string) => void;
  onCheckout: (plan: 'pro' | 'team') => void;
}

export function LimitsBanner({
  repoCount,
  currentTeamId,
  teams,
  analyzedRepoCount,
  billingLoading,
  onPortal,
  onCheckout,
}: LimitsBannerProps) {
  const currentTeam = teams.find((t) => t.teamId === currentTeamId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4"
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase tracking-wide">
            Repos
          </span>
          <span className="text-lg font-bold text-white">{repoCount}</span>
          <span className="text-xs text-slate-500">
            / {currentTeamId === 'personal' ? '3' : '∞'}
          </span>
        </div>
        <div className="h-4 w-px bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase tracking-wide">
            This Month
          </span>
          <span className="text-lg font-bold text-white">
            {currentTeamId === 'personal'
              ? Math.max(0, 10 - analyzedRepoCount)
              : '∞'}
          </span>
          <span className="text-xs text-slate-500">runs left</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs text-slate-500">
          <span className="capitalize font-semibold text-slate-300">
            {currentTeamId === 'personal'
              ? 'Personal Plan'
              : `${currentTeam?.team.plan || 'Free'} Plan`}
          </span>
        </div>
        {currentTeamId !== 'personal' && (
          <div className="flex items-center gap-2">
            {currentTeam?.team.stripeCustomerId ? (
              <button
                onClick={() => {
                  if (currentTeam.team.stripeCustomerId)
                    onPortal(currentTeam.team.stripeCustomerId);
                }}
                disabled={billingLoading}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold px-3 py-1 rounded-lg border border-cyan-400/30 hover:bg-cyan-400/10 transition-all"
              >
                {billingLoading ? 'Loading...' : 'Manage Billing'}
              </button>
            ) : (
              <button
                onClick={() => onCheckout('team')}
                disabled={billingLoading}
                className="text-xs bg-cyan-500 hover:bg-cyan-400 text-white font-bold px-3 py-1 rounded-lg shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                {billingLoading ? 'Loading...' : 'Upgrade'}
              </button>
            )}
          </div>
        )}
        {currentTeamId === 'personal' && (
          <Link
            href="/pricing"
            className="text-xs text-cyan-400 hover:underline font-bold"
          >
            Pricing
          </Link>
        )}
      </div>
    </motion.div>
  );
}
