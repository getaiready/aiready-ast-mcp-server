'use client';

import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { toast } from 'sonner';

interface ExpertReviewPanelProps {
  remediationId: string;
  suggestedDiff?: string;
  onClose: () => void;
  onDecision: (decision: 'approve' | 'request-changes') => void;
}

export function ExpertReviewPanel({
  remediationId,
  suggestedDiff,
  onClose,
  onDecision,
}: ExpertReviewPanelProps) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(decision: 'approve' | 'request-changes') {
    if (decision === 'request-changes' && !comment) {
      toast.error('Please provide feedback for the iteration');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/remediation/${remediationId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment, decision }),
      });

      if (res.ok) {
        toast.success(
          decision === 'approve'
            ? 'Remediation approved'
            : 'Feedback sent to Agent'
        );
        onDecision(decision);
        onClose();
      } else {
        toast.error('Failed to submit review');
      }
    } catch (_err) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-4xl rounded-2xl overflow-hidden border border-purple-500/20 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Icon name="Eye" className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Expert Remediation Review
              </h2>
              <p className="text-xs text-slate-400">
                Reviewing proposed Swarm refactor for <b>{remediationId}</b>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <Icon name="X" className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Proposed Changes (Diff)
            </h3>
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
              {suggestedDiff || 'No diff available for this remediation.'}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Expert Feedback
            </h3>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Provide context for the agent (e.g., 'Ensure we use the new AuthProvider interface' or 'LGTM, but check the naming in gate.ts')"
              className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-white/5 bg-slate-900/50 flex items-center justify-between gap-4">
          <button
            onClick={() => handleSubmit('request-changes')}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-all disabled:opacity-50"
          >
            Request Iteration
          </button>
          <button
            onClick={() => handleSubmit('approve')}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : 'Approve & Create PR'}
            {!loading && <Icon name="CheckCircle" className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
