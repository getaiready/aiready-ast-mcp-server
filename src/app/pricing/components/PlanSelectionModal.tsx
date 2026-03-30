'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  teams: any[];
  onSelectTeam: (teamId: string) => void;
  isLoading: boolean;
}

export function PlanSelectionModal({
  isOpen,
  onClose,
  planName,
  teams,
  onSelectTeam,
  isLoading,
}: PlanSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-card w-full max-w-lg rounded-3xl p-8 border border-cyan-500/30 overflow-hidden relative"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <h3 className="text-2xl font-bold text-white mb-2">
            Upgrade to {planName}
          </h3>
          <p className="text-slate-400 mb-8">
            Select the team you want to upgrade.
          </p>

          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {teams.map((teamMember) => (
              <button
                key={teamMember.teamId}
                disabled={isLoading}
                onClick={() => onSelectTeam(teamMember.teamId)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/50 transition-all text-left group"
              >
                <div>
                  <div className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                    {teamMember.team.name}
                  </div>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                    Current: {teamMember.team.plan || 'Free'}
                  </div>
                </div>
                <div className="text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>

          {teams.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-6">
                You don't have any teams yet.
              </p>
              <a
                href="/dashboard"
                className="inline-block px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl transition-all"
              >
                Create a Team
              </a>
            </div>
          )}

          {isLoading && (
            <div className="mt-6 flex items-center justify-center gap-3 text-cyan-400">
              <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium">Redirecting to Stripe...</span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
