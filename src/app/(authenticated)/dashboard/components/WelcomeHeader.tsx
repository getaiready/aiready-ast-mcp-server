'use client';

import { motion } from 'framer-motion';
import {
  scoreColor,
  scoreBg,
  scoreGlow,
  scoreLabel,
} from '@aiready/components';

interface WelcomeHeaderProps {
  userName: string;
  repoCount: number;
  overallScore: number | null;
}

export function WelcomeHeader({
  userName,
  repoCount,
  overallScore,
}: WelcomeHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, {userName.split(' ')[0] || 'Developer'}!
        </h1>
        <p className="text-slate-400 mt-1">
          {repoCount === 0
            ? 'Add your first repository to start tracking AI readiness.'
            : `Tracking ${repoCount} repositor${repoCount === 1 ? 'y' : 'ies'}`}
        </p>
      </div>
      {overallScore != null && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`flex items-center gap-4 px-6 py-4 rounded-2xl border ${scoreBg(overallScore)} shadow-lg ${scoreGlow(overallScore)}`}
        >
          <div className="text-right">
            <div className={`text-4xl font-black ${scoreColor(overallScore)}`}>
              {overallScore}
            </div>
            <div className="text-xs text-slate-500 -mt-1">/ 100</div>
          </div>
          <div className="pl-4 border-l border-slate-700">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Overall AI Score
            </div>
            <div
              className={`text-sm font-semibold ${scoreColor(overallScore)}`}
            >
              {scoreLabel(overallScore)}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
