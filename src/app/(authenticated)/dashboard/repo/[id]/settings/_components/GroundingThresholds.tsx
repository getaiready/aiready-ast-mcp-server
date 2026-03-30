import { ToolName } from '@aiready/core/client';
import { ThresholdSlider } from './ThresholdSlider';

interface GroundingThresholdsProps {
  settings: any;
  updateToolConfig: (tool: string, config: any) => void;
}

export function GroundingThresholds({
  settings,
  updateToolConfig,
}: GroundingThresholdsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
        Agent Grounding & Docs
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ThresholdSlider
          label="Max Recommended Depth"
          value={
            settings.tools?.[ToolName.AgentGrounding]?.maxRecommendedDepth || 4
          }
          min={2}
          max={10}
          step={1}
          unit=" levels"
          accentColor="amber"
          tipTitle="Reasoning Complexity"
          tipBody="Deeply nested logic is significantly harder for AI agents to reason about accurately. Targets flatter architectures."
          onChange={(val) =>
            updateToolConfig(ToolName.AgentGrounding, {
              maxRecommendedDepth: val,
            })
          }
        />
        <ThresholdSlider
          label="Doc Drift Stale Months"
          value={settings.tools?.[ToolName.DocDrift]?.staleMonths || 6}
          min={1}
          max={24}
          step={1}
          unit=" months"
          accentColor="amber"
          tipTitle="Information Freshness"
          tipBody="Documentation older than this threshold is compared against recent code changes to detect hallucination risks."
          onChange={(val) =>
            updateToolConfig(ToolName.DocDrift, { staleMonths: val })
          }
        />
      </div>
    </div>
  );
}
