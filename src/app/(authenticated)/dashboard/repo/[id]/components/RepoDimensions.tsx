'use client';

import { motion } from 'framer-motion';
import { scoreColor } from '@aiready/components';

interface RepoDimensionsProps {
  analysis: any;
  selectedTool: string | null;
  onSelectTool: (tool: string | null) => void;
  toolLabels: Record<string, string>;
  totalIssues: number;
}

export function RepoDimensions({
  analysis,
  selectedTool,
  onSelectTool,
  toolLabels,
  totalIssues,
}: RepoDimensionsProps) {
  if (!analysis?.breakdown) return null;

  return (
    <aside className="lg:col-span-1 space-y-6">
      <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em]">
        Dimensions
      </h3>
      <div className="grid grid-cols-1 gap-3">
        <button
          onClick={() => onSelectTool(null)}
          className={`group w-full text-left glass-card p-3 rounded-xl border transition-all duration-300 relative overflow-hidden ${!selectedTool ? 'border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]' : 'border-white/5 hover:border-white/10 text-slate-500 hover:text-white'}`}
        >
          {!selectedTool && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
          )}
          <div
            className={`flex items-center justify-between transition-transform duration-300 ${!selectedTool ? 'pl-3' : 'pl-1'}`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${!selectedTool ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-700 group-hover:bg-slate-500'}`}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${!selectedTool ? 'text-cyan-400' : 'text-current'}`}
              >
                All Dimensions
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {totalIssues} issues
            </span>
          </div>
        </button>
        {Object.entries(analysis.breakdown).map(([key, val]: [string, any]) => (
          <button
            key={key}
            onClick={() => onSelectTool(selectedTool === key ? null : key)}
            className={`group w-full text-left glass-card p-4 rounded-2xl border transition-all duration-300 space-y-2 relative overflow-hidden ${selectedTool === key ? 'border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-[1.02]' : selectedTool ? 'border-white/5 opacity-50 hover:opacity-100 saturate-50 hover:saturate-100' : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}`}
          >
            {selectedTool === key && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            )}
            <div
              className={`flex items-center justify-between transition-transform duration-300 ${selectedTool === key ? 'pl-3' : 'pl-1'}`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${selectedTool === key ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-slate-700 group-hover:bg-slate-500'}`}
                />
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${selectedTool === key ? 'text-cyan-400' : 'text-slate-400 group-hover:text-white'}`}
                >
                  {toolLabels[key] || key.replace(/([A-Z])/g, ' $1')}
                </span>
              </div>
              <span
                className={`text-sm font-black transition-colors duration-300 ${selectedTool === key ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : scoreColor(val.score)}`}
              >
                {val.score}
              </span>
            </div>
            <div
              className={`h-1 bg-slate-800 rounded-full overflow-hidden transition-all duration-300 ${selectedTool === key ? 'ml-3' : 'ml-1'}`}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${val.score}%` }}
                className={`h-full ${val.score > 80 ? 'bg-emerald-500' : val.score > 60 ? 'bg-cyan-500' : val.score > 40 ? 'bg-amber-500' : 'bg-red-500'} ${selectedTool === key ? 'brightness-110' : 'opacity-80'}`}
              />
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
