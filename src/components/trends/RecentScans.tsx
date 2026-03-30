'use client';

import { scoreColor, scoreLabel } from '@aiready/components';
import type { Analysis } from '@/lib/db';

export function RecentScans({ history }: { history: Analysis[] }) {
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">
        Recent Scans
      </h3>
      <div className="space-y-3">
        {history
          .slice()
          .reverse()
          .map((analysis) => (
            <div
              key={analysis.id}
              className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between group hover:border-slate-700 transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-white mb-0.5">
                  {new Date(analysis.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-[10px] text-slate-500 uppercase font-black">
                  {scoreLabel(analysis.aiScore!)}
                </p>
              </div>
              <div
                className={`text-lg font-black ${scoreColor(analysis.aiScore!)}`}
              >
                {analysis.aiScore}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
