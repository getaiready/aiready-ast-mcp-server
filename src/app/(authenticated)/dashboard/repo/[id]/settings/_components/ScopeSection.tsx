import { SettingsIcon, RefreshCwIcon, InfoIcon } from '@/components/Icons';
import { AIReadyConfig } from '@aiready/core/client';

interface ScopeSectionProps {
  settings: AIReadyConfig;
  onUpdate: (config: any) => void;
  onReset: () => void;
}

export function ScopeSection({
  settings,
  onUpdate,
  onReset,
}: ScopeSectionProps) {
  return (
    <div className="glass-card rounded-3xl p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <SettingsIcon className="w-5 h-5 text-cyan-500" />
          </div>
          <h2 className="text-xl font-bold">Scan Scope</h2>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors text-xs font-bold uppercase tracking-wider"
        >
          <RefreshCwIcon className="w-3.5 h-3.5" />
          Reset to Defaults
        </button>
      </div>

      <div className="space-y-4">
        <div className="group relative">
          <label className="block text-sm font-bold text-slate-400 mb-2 flex items-center gap-2">
            Excluded Patterns (Glob)
            <div className="group relative">
              <InfoIcon className="w-4 h-4 text-slate-600 cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 z-50 shadow-2xl">
                <p className="font-bold text-cyan-400 mb-1">
                  Scope Optimization
                </p>
                Exclude tests, build artifacts, or vendor code to save context
                window and focus analysis on core business logic.
              </div>
            </div>
          </label>
          <textarea
            value={settings.scan?.exclude?.join(', ') || ''}
            onChange={(e) =>
              onUpdate({
                exclude: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="**/node_modules/**, **/dist/**"
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-colors min-h-[100px] font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}
