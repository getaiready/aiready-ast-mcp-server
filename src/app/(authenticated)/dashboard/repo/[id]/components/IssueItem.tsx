'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircleIcon, FileIcon, BrainIcon } from '@/components/Icons';

interface IssueItemProps {
  issue: any;
  isExpanded: boolean;
  onToggle: () => void;
  severityColors: Record<string, string>;
  toolLabels: Record<string, string>;
}

export function IssueItem({
  issue,
  isExpanded,
  onToggle,
  severityColors,
  toolLabels,
}: IssueItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card rounded-2xl border transition-all overflow-hidden cursor-pointer ${isExpanded ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-white/5 hover:border-white/10 group'}`}
      onClick={onToggle}
    >
      <div className="p-5 flex items-start gap-4">
        <div
          className={`mt-0.5 p-2 rounded-xl border transition-colors ${isExpanded ? severityColors[issue.severity] : 'text-slate-500 border-slate-800'}`}
        >
          <AlertCircleIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                {toolLabels[issue.tool] ||
                  issue.tool.replace(/([A-Z])/g, ' $1')}{' '}
                / {issue.type || 'logic'}
              </span>
              {!isExpanded && (
                <div className="flex gap-2">
                  {issue.locations.length > 0 && (
                    <span className="text-[10px] text-slate-600 font-mono truncate max-w-[150px]">
                      {issue.locations[0].path.split('/').pop()}
                      {typeof issue.locations[0].line === 'number' &&
                        issue.locations[0].line > 0 &&
                        `:L${issue.locations[0].line}`}
                    </span>
                  )}
                </div>
              )}
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${severityColors[issue.severity]}`}
            >
              {issue.severity}
            </span>
          </div>
          <h4 className="font-bold text-white text-md leading-snug">
            {issue.message}
          </h4>

          {!isExpanded && (
            <div className="flex flex-wrap gap-2 pt-1 opacity-70">
              {issue.locations
                .slice(0, 3)
                .map((loc: { path: string; line?: number }, idx: number) => (
                  <div
                    key={idx}
                    className="text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5"
                  >
                    {loc.path.split('/').pop()}
                    {typeof loc.line === 'number' &&
                      loc.line > 0 &&
                      `:L${loc.line}`}
                  </div>
                ))}
              {issue.locations.length > 3 && (
                <div className="text-[9px] font-mono text-slate-500 py-0.5">
                  +{issue.locations.length - 3} more
                </div>
              )}
            </div>
          )}

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 space-y-4">
                  <div className="flex flex-wrap gap-2 pt-1">
                    {issue.locations.map(
                      (loc: { path: string; line?: number }, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 bg-cyan-400/5 px-2 py-1 rounded border border-cyan-400/10"
                        >
                          <FileIcon className="w-3 h-3" />
                          {loc.path}
                          {typeof loc.line === 'number' && loc.line > 0 && (
                            <span className="text-slate-600">:L{loc.line}</span>
                          )}
                        </div>
                      )
                    )}

                    {issue.similarity && (
                      <div className="text-[10px] font-bold text-emerald-400 bg-emerald-400/5 px-2 py-1 rounded border border-emerald-400/10">
                        {(issue.similarity * 100).toFixed(0)}% Similarity
                      </div>
                    )}
                    {issue.chainLength && (
                      <div className="text-[10px] font-bold text-amber-400 bg-amber-400/5 px-2 py-1 rounded border border-amber-400/10">
                        Chain: {issue.chainLength}
                      </div>
                    )}
                    {issue.expected && (
                      <div className="text-[10px] font-bold text-blue-400 bg-blue-400/5 px-2 py-1 rounded border border-blue-400/10">
                        Expected: {issue.expected}
                      </div>
                    )}
                  </div>

                  {(issue.suggestion || issue.action) && (
                    <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 space-y-2">
                      <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                        <BrainIcon className="w-4 h-4" />
                        Recommendation
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed italic">
                        "{issue.suggestion || issue.action}"
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-1">
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-slate-600 group-hover:text-slate-400"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
