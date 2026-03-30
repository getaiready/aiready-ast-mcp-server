import { InfoIcon } from '@/components/Icons';

interface ThresholdSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  isPercentage?: boolean;
  accentColor?: string;
  tipTitle?: string;
  tipBody?: string;
  onChange: (value: number) => void;
}

export function ThresholdSlider({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  isPercentage = false,
  accentColor = 'amber',
  tipTitle,
  tipBody,
  onChange,
}: ThresholdSliderProps) {
  const displayValue = isPercentage
    ? `${Math.round(value * 100)}%`
    : `${value}${unit}`;
  const accentClass = `accent-${accentColor}-500`;
  const textClass = `text-${accentColor}-500`;
  const tipTitleClass = `text-${accentColor}-400`;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-2">
          {label}
          {tipBody && (
            <div className="group relative">
              <InfoIcon className="w-4 h-4 text-slate-600 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 z-50 shadow-2xl">
                {tipTitle && (
                  <p className={`font-bold ${tipTitleClass} mb-1`}>
                    {tipTitle}
                  </p>
                )}
                {tipBody}
              </div>
            </div>
          )}
        </span>
        <span className={textClass}>{displayValue}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={`w-full ${accentClass}`}
      />
    </div>
  );
}
