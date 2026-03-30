import { ShieldIcon } from '@/components/Icons';
import { AIReadyConfig } from '@aiready/core/client';
import { ALL_TOOLS } from './constants';

interface ToolsSectionProps {
  settings: AIReadyConfig;
  onToggleTool: (toolId: string) => void;
}

export function ToolsSection({ settings, onToggleTool }: ToolsSectionProps) {
  return (
    <div className="glass-card rounded-3xl p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
          <ShieldIcon className="w-5 h-5 text-purple-500" />
        </div>
        <h2 className="text-xl font-bold">Standard Uplifting Spokes</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_TOOLS.map((tool) => (
          <div
            key={tool.id}
            onClick={() => onToggleTool(tool.id)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              settings.scan?.tools?.includes(tool.id)
                ? 'bg-cyan-500/5 border-cyan-500/30'
                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm">{tool.name}</span>
              <div
                className={`w-4 h-4 rounded-full border ${
                  settings.scan?.tools?.includes(tool.id)
                    ? 'bg-cyan-500 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]'
                    : 'border-slate-700'
                }`}
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tight">
              {tool.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
