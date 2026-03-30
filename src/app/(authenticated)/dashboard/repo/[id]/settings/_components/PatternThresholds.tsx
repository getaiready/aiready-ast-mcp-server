import { useState } from 'react';
import { ThresholdSlider } from './ThresholdSlider';
import ConfirmationModal from '@/components/ConfirmationModal';

interface PatternThresholdsProps {
  config: any;
  updateConfig: (config: any) => void;
}

export function PatternThresholds({
  config,
  updateConfig,
}: PatternThresholdsProps) {
  const [confirmData, setConfirmData] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    onConfirm: () => {},
  });

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
        Pattern Detection
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ThresholdSlider
          label="Min Similarity"
          value={config.minSimilarity || 0.8}
          min={0.4}
          max={1.0}
          step={0.05}
          isPercentage
          accentColor="amber"
          tipTitle="Cloning Strictness"
          tipBody="Lower values find more subtle duplicates. Higher values focus on near-identical 'copy-paste' code clones."
          onChange={(val) => updateConfig({ minSimilarity: val })}
        />
        <ThresholdSlider
          label="Min Lines"
          value={config.minLines || 5}
          min={3}
          max={50}
          step={1}
          unit=" lines"
          accentColor="amber"
          tipTitle="Noise Filtering"
          tipBody="Minimum length of a code block to be considered for duplication. Increase this to ignore boilerplate snippets."
          onChange={(val) => updateConfig({ minLines: val })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-800/50">
        <div
          onClick={() => {
            const current = config.approx !== false;
            if (current) {
              setConfirmData({
                isOpen: true,
                onConfirm: () => {
                  updateConfig({ approx: false });
                  setConfirmData((prev) => ({ ...prev, isOpen: false }));
                },
              });
            } else {
              updateConfig({ approx: true });
            }
          }}
          className={`group relative p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
            config.approx !== false
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500'
              : 'bg-red-500/10 border-red-500/30 text-red-500'
          }`}
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase flex items-center gap-2">
              Approximate Match
              {config.approx === false && (
                <span className="bg-red-500 text-[8px] px-1.5 py-0.5 rounded text-white">
                  SLOW
                </span>
              )}
            </span>
          </div>
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              config.approx !== false
                ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                : 'bg-red-500'
            }`}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Min Tokens
          </label>
          <input
            type="number"
            value={config.minSharedTokens || 10}
            onChange={(e) =>
              updateConfig({ minSharedTokens: parseInt(e.target.value) })
            }
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-2 text-xs text-amber-500 focus:outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
            Max Candidates
          </label>
          <input
            type="number"
            value={config.maxCandidatesPerBlock || 100}
            onChange={(e) =>
              updateConfig({ maxCandidatesPerBlock: parseInt(e.target.value) })
            }
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-2 text-xs text-amber-500 focus:outline-none"
          />
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmData.isOpen}
        onClose={() => setConfirmData((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmData.onConfirm}
        title="Disable Approximate Matching?"
        message="WARNING: Disabling approximate matching forces an exact O(N^2) comparison. This will significantly increase scan time."
        variant="warning"
        confirmText="Enable Anyway"
      />
    </div>
  );
}
