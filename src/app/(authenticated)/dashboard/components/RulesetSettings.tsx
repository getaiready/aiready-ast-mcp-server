'use client';

import { useState, useEffect, useCallback } from 'react';
import { ToolName, FRIENDLY_TOOL_NAMES } from '@aiready/core/client';
import { toast } from 'sonner';
import { Icon } from '@/components/Icon';

interface RuleOverride {
  threshold?: number;
  weight?: number;
  enabled?: boolean;
}

interface CustomRuleset {
  overrides: Record<string, RuleOverride>;
  enforcement: 'strict' | 'advisory';
}

const DEFAULT_WEIGHTS: Record<string, number> = {
  [ToolName.PatternDetect]: 22,
  [ToolName.ContextAnalyzer]: 19,
  [ToolName.NamingConsistency]: 14,
  [ToolName.AiSignalClarity]: 11,
  [ToolName.AgentGrounding]: 10,
  [ToolName.TestabilityIndex]: 10,
  [ToolName.DocDrift]: 8,
  [ToolName.DependencyHealth]: 6,
  [ToolName.ChangeAmplification]: 8,
  [ToolName.CognitiveLoad]: 7,
  [ToolName.PatternEntropy]: 6,
  [ToolName.ConceptCohesion]: 6,
  [ToolName.SemanticDistance]: 5,
  [ToolName.ContractEnforcement]: 10,
};

export function RulesetSettings({ teamId }: { teamId: string }) {
  const [ruleset, setRuleset] = useState<CustomRuleset>({
    overrides: {},
    enforcement: 'advisory',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRuleset = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams/${teamId}/ruleset`);
      if (res.ok) {
        const data = await res.json();
        if (data.ruleset) {
          setRuleset(data.ruleset);
        }
      }
    } catch (_err) {
      console.error('Failed to fetch ruleset:', _err);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchRuleset();
  }, [fetchRuleset]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/ruleset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleset),
      });
      if (res.ok) {
        toast.success('Ruleset updated successfully');
      } else {
        toast.error('Failed to update ruleset');
      }
    } catch (_err) {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  }

  const updateOverride = (
    tool: string,
    field: keyof RuleOverride,
    value: any
  ) => {
    setRuleset((prev) => ({
      ...prev,
      overrides: {
        ...prev.overrides,
        [tool]: {
          ...(prev.overrides[tool] || {}),
          [field]: value,
        },
      },
    }));
  };

  if (loading)
    return <div className="animate-pulse h-64 bg-slate-800/20 rounded-2xl" />;

  return (
    <section className="glass-card rounded-2xl p-6 space-y-8 border border-purple-500/10 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            Organization Ruleset & Governance
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure bespoke AI-readiness standards and enforcement levels for
            your team.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-purple-600/20"
        >
          {saving ? 'Saving...' : 'Save Ruleset'}
          <Icon name="Save" className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Icon name="Shield" className="w-4 h-4 text-purple-400" />
            Governance Policy
          </h3>
          <div className="space-y-3">
            <button
              onClick={() =>
                setRuleset((p) => ({ ...p, enforcement: 'advisory' }))
              }
              className={`w-full p-4 rounded-xl border transition-all text-left ${ruleset.enforcement === 'advisory' ? 'bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/50' : 'bg-slate-800/30 border-slate-700'}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">Advisory</p>
                {ruleset.enforcement === 'advisory' && (
                  <Icon
                    name="CheckCircle"
                    className="w-4 h-4 text-purple-400"
                  />
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Show warnings and performance metrics but don't block
                development workflows or CI/CD pipelines.
              </p>
            </button>
            <button
              onClick={() =>
                setRuleset((p) => ({ ...p, enforcement: 'strict' }))
              }
              className={`w-full p-4 rounded-xl border transition-all text-left ${ruleset.enforcement === 'strict' ? 'bg-red-500/10 border-red-500/50 ring-1 ring-red-500/50' : 'bg-slate-800/30 border-slate-700'}`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white">
                  Strict Enforcement
                </p>
                {ruleset.enforcement === 'strict' && (
                  <Icon name="ShieldAlert" className="w-4 h-4 text-red-400" />
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Enforce strict quality gates. PRs will be blocked if
                AI-readiness scores fall below organization thresholds.
              </p>
            </button>
          </div>

          <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <Icon name="Info" className="w-4 h-4 text-blue-400 mt-0.5" />
              <p className="text-[10px] text-blue-200 leading-relaxed uppercase font-medium">
                Enterprise Feature
              </p>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Custom rulesets are currently available as part of your Enterprise
              plan. Changes apply to all new scans across all repositories in
              this organization.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Icon name="Settings2" className="w-4 h-4 text-purple-400" />
            Metric Thresholds & Weights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(DEFAULT_WEIGHTS).map(([tool, weight]) => {
              const override = ruleset.overrides[tool] || {};
              const isEnabled = override.enabled !== false;
              const currentWeight = override.weight ?? weight;

              return (
                <div
                  key={tool}
                  className={`p-4 rounded-xl border transition-all ${isEnabled ? 'bg-slate-800/40 border-slate-700/50 shadow-sm' : 'bg-slate-900/50 border-slate-800 opacity-50'}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-white tracking-tight">
                      {FRIENDLY_TOOL_NAMES[tool as ToolName] || tool}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) =>
                          updateOverride(tool, 'enabled', e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                        Weight (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentWeight}
                        disabled={!isEnabled}
                        onChange={(e) =>
                          updateOverride(
                            tool,
                            'weight',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full bg-slate-900/80 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">
                        Threshold (0-100)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="70"
                        value={override.threshold ?? ''}
                        disabled={!isEnabled}
                        onChange={(e) =>
                          updateOverride(
                            tool,
                            'threshold',
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full bg-slate-900/80 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
