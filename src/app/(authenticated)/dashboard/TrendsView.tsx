'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Analysis } from '@/lib/db';
import { TrendChart } from '@/components/trends/TrendChart';
import { fetchRepoHistory } from '@/lib/api/history';

interface TrendsViewProps {
  repoId: string;
  repoName: string;
  onClose: () => void;
}

export function TrendsView({ repoId, repoName, onClose }: TrendsViewProps) {
  const [history, setHistory] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      const data = await fetchRepoHistory(repoId, 20);
      setHistory(data);
      setLoading(false);
    }
    fetchHistory();
  }, [repoId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const scores = history.map((h) => h.aiScore || 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-2xl p-8 max-w-4xl mx-auto border border-white/10 shadow-2xl overflow-hidden"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Analysis Trends</h2>
          <p className="text-slate-400 text-sm">{repoName}</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors"
        >
          Close
        </button>
      </div>

      {history.length < 2 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-700/30">
          <p className="text-slate-400">Not enough data to show trends yet.</p>
          <p className="text-xs text-slate-500 mt-2">
            Run more analyses to see your progress.
          </p>
        </div>
      ) : (
        <TrendChart history={history} height={250} width={600} padding={40} />
      )}

      <div className="mt-8 flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
          📈
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Progress Insights</h4>
          <p className="text-xs text-slate-400">
            {scores.length >= 2
              ? scores[scores.length - 1] > scores[0]
                ? `Your AI-Readiness score improved by ${scores[scores.length - 1] - scores[0]} points since tracking began.`
                : scores[scores.length - 1] < scores[0]
                  ? `Your score decreased by ${scores[0] - scores[scores.length - 1]} points. Focus on reducing deep import chains.`
                  : 'Your score is stable. Look for quick wins to boost it further.'
              : 'Keep running scans to build your historical record.'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
