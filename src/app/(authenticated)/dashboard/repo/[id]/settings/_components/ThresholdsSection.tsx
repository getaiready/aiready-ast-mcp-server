import { TargetIcon } from '@/components/Icons';
import { AIReadyConfig, ToolName } from '@aiready/core/client';
import { ThresholdSlider } from './ThresholdSlider';
import { PatternThresholds } from './PatternThresholds';
import { ContextThresholds } from './ContextThresholds';
import { SignalThresholds } from './SignalThresholds';
import { GroundingThresholds } from './GroundingThresholds';
import { ScoringThresholds } from './ScoringThresholds';

interface ThresholdsSectionProps {
  settings: AIReadyConfig;
  updateToolConfig: (tool: string, config: any) => void;
  updateScoringConfig: (config: any) => void;
}

export function ThresholdsSection({
  settings,
  updateToolConfig,
  updateScoringConfig,
}: ThresholdsSectionProps) {
  return (
    <div className="glass-card rounded-3xl p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <TargetIcon className="w-5 h-5 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold">Fine-Tuning Thresholds</h2>
      </div>

      <div className="space-y-12">
        <PatternThresholds
          config={(settings.tools?.[ToolName.PatternDetect] || {}) as any}
          updateConfig={(cfg) => updateToolConfig(ToolName.PatternDetect, cfg)}
        />

        <ContextThresholds
          config={(settings.tools?.[ToolName.ContextAnalyzer] || {}) as any}
          updateConfig={(cfg) =>
            updateToolConfig(ToolName.ContextAnalyzer, cfg)
          }
        />

        <SignalThresholds
          config={(settings.tools?.[ToolName.AiSignalClarity] || {}) as any}
          updateConfig={(cfg) =>
            updateToolConfig(ToolName.AiSignalClarity, cfg)
          }
        />

        <GroundingThresholds
          settings={settings}
          updateToolConfig={updateToolConfig}
        />

        {/* Naming Consistency & Standards */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
            Naming & Consistency
          </h3>
          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
              Disable Specific Checks
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                'single-letter',
                'abbreviation',
                'convention-mix',
                'unclear',
              ].map((check) => (
                <div
                  key={check}
                  onClick={() => {
                    const disabled =
                      (settings.tools?.[ToolName.NamingConsistency] as any)
                        ?.disableChecks || [];
                    const newDisabled = disabled.includes(check)
                      ? disabled.filter((c: string) => c !== check)
                      : [...disabled, check];
                    updateToolConfig(ToolName.NamingConsistency, {
                      disableChecks: newDisabled,
                    });
                  }}
                  className={`p-2 rounded-lg border text-[10px] font-bold uppercase text-center cursor-pointer transition-all ${
                    (
                      (settings.tools?.[ToolName.NamingConsistency] as any)
                        ?.disableChecks || []
                    ).includes(check)
                      ? 'bg-slate-800 border-slate-700 text-slate-500 line-through'
                      : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                  }`}
                >
                  {check}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testability & Dependencies */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
            Tests & Dependencies
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ThresholdSlider
              label="Min Coverage Ratio"
              value={
                settings.tools?.[ToolName.TestabilityIndex]?.minCoverageRatio ||
                0.5
              }
              min={0.1}
              max={1.0}
              step={0.05}
              isPercentage
              accentColor="amber"
              onChange={(val) =>
                updateToolConfig(ToolName.TestabilityIndex, {
                  minCoverageRatio: val,
                })
              }
            />
            <ThresholdSlider
              label="Package Cutoff Year"
              value={
                settings.tools?.[ToolName.DependencyHealth]
                  ?.trainingCutoffYear || 2024
              }
              min={2015}
              max={new Date().getFullYear()}
              step={1}
              accentColor="amber"
              onChange={(val) =>
                updateToolConfig(ToolName.DependencyHealth, {
                  trainingCutoffYear: val,
                })
              }
            />
          </div>
        </div>

        <ScoringThresholds
          settings={settings}
          updateScoringConfig={updateScoringConfig}
        />
      </div>
    </div>
  );
}
