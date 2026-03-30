'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface BadgeModalProps {
  repo: { id: string; name: string } | null;
  onClose: () => void;
}

export function BadgeModal({ repo, onClose }: BadgeModalProps) {
  return (
    <AnimatePresence>
      {repo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-xl shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🛡️ AI-Readiness Badge
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center p-8 bg-slate-950/50 rounded-2xl border border-slate-700/50">
                <img
                  src={`/api/repos/${repo.id}/badge`}
                  alt="AI Readiness Badge"
                  className="h-8"
                />
                <p className="text-xs text-slate-500 mt-4">Preview Badge</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Markdown (README.md)
                  </label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={`[![AI-Readiness](https://platform.getaiready.dev/api/repos/${repo.id}/badge)](https://platform.getaiready.dev/dashboard)`}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `[![AI-Readiness](https://platform.getaiready.dev/api/repos/${repo.id}/badge)](https://platform.getaiready.dev/dashboard)`
                        );
                        toast.success('Copied to clipboard!');
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Direct URL
                  </label>
                  <input
                    readOnly
                    value={`https://platform.getaiready.dev/api/repos/${repo.id}/badge`}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
