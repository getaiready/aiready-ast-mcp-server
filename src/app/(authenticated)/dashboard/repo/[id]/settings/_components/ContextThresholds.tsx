import { ThresholdSlider } from './ThresholdSlider';

interface ContextThresholdsProps {
  config: any;
  updateConfig: (config: any) => void;
}

export function ContextThresholds({
  config,
  updateConfig,
}: ContextThresholdsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
        Context & Architecture
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ThresholdSlider
          label="Max Context Depth"
          value={config.maxDepth || 5}
          min={1}
          max={15}
          step={1}
          unit=" layers"
          accentColor="amber"
          tipTitle="Dependency Horizon"
          tipBody="How deep to follow import chains. Higher depth captures transitive complexity but increases context consumption."
          onChange={(val) => updateConfig({ maxDepth: val })}
        />
        <ThresholdSlider
          label="Min Cohesion Score"
          value={config.minCohesion || 0.6}
          min={0.1}
          max={0.9}
          step={0.05}
          isPercentage
          accentColor="amber"
          tipTitle="Architectural Health"
          tipBody="Files below this target score are flagged as 'God Objects' or fragmented logic needing modularization."
          onChange={(val) => updateConfig({ minCohesion: val })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-800/50">
        <ThresholdSlider
          label="Max Fragmentation"
          value={config.maxFragmentation || 0.4}
          min={0.1}
          max={0.9}
          step={0.05}
          isPercentage
          accentColor="amber"
          tipBody="Threshold for logic dispersion. Higher values allow functionality to be more spread across the codebase before flagging."
          onChange={(val) => updateConfig({ maxFragmentation: val })}
        />

        <div className="flex flex-col justify-end gap-4">
          <div className="group relative p-3 rounded-xl border bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed flex items-center justify-between opacity-60">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase flex items-center gap-2">
                Scan Node Modules
                <span className="bg-slate-800 text-[8px] px-1.5 py-0.5 rounded text-slate-500 border border-slate-700">
                  LOCKED
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
              Analysis Focus:
            </span>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800 w-full">
              {[
                { id: 'all', label: 'all' },
                { id: 'cohesion', label: 'cohesion' },
                { id: 'fragmentation', label: 'fragment' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => updateConfig({ focus: f.id as any })}
                  className={`flex-1 text-[9px] uppercase font-bold py-1 px-2 rounded-md transition-all flex items-center justify-center gap-1 ${
                    (config.focus || 'all') === f.id
                      ? 'bg-slate-700 text-cyan-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {f.label}
                  {f.id === 'all' && (
                    <span className="text-[7px] opacity-50 underline decoration-cyan-500/50">
                      (Rec)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
