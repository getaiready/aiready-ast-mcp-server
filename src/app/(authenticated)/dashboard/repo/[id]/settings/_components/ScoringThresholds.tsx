import { ChartIcon } from '@/components/Icons';
import { ThresholdSlider } from './ThresholdSlider';

interface ScoringThresholdsProps {
  settings: any;
  updateScoringConfig: (config: any) => void;
}

export function ScoringThresholds({
  settings,
  updateScoringConfig,
}: ScoringThresholdsProps) {
  return (
    <div className="pt-8 border-t border-slate-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-500/10 rounded-xl border border-green-500/20">
          <ChartIcon className="w-5 h-5 text-green-500" />
        </div>
        <h2 className="text-xl font-bold">Global Quality Gate</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ThresholdSlider
          label="Pass/Fail Threshold"
          value={settings.scoring?.threshold || 70}
          min={30}
          max={95}
          step={5}
          accentColor="green"
          tipBody="Minimum overall AI-Readiness score required to pass CI checks and PR status gates."
          onChange={(val) => updateScoringConfig({ threshold: val })}
        />
        <div className="flex items-center justify-center p-6 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
          <p className="text-[10px] text-slate-500 text-center uppercase leading-loose tracking-widest">
            Adjusting these parameters changes the strictness of your{' '}
            <span className="text-cyan-500">AIReady Score</span>. <br />
            Lower thresholds reduce noise; higher thresholds uplift standards.
          </p>
        </div>
      </div>
    </div>
  );
}
