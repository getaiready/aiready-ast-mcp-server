interface SignalThresholdsProps {
  config: any;
  updateConfig: (config: any) => void;
}

export function SignalThresholds({
  config,
  updateConfig,
}: SignalThresholdsProps) {
  const signalCfg = config || {};

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">
        AI Signal Clarity
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          {
            id: 'checkMagicLiterals',
            label: 'Magic Literals',
            tip: 'Detects hardcoded values that lack semantic context for AI models.',
          },
          {
            id: 'checkBooleanTraps',
            label: 'Boolean Traps',
            tip: 'Identifies positional booleans that are ambiguous without parameter names.',
          },
          {
            id: 'checkAmbiguousNames',
            label: 'Ambiguous Names',
            tip: 'Flags variables like "data" or "item" that provide no reasoning signal.',
          },
          {
            id: 'checkUndocumentedExports',
            label: 'Undocumented Exports',
            tip: 'Ensures public APIs have JSDoc/Docstrings for agent grounding.',
          },
          {
            id: 'checkImplicitSideEffects',
            label: 'Side Effects',
            tip: 'Detects functions that modify global state, confusing agentic logic.',
          },
          {
            id: 'checkDeepCallbacks',
            label: 'Deep Callbacks',
            tip: 'Flags nested callbacks that create complex reasoning paths for LLMs.',
          },
        ].map((check) => (
          <div
            key={check.id}
            onClick={() => {
              const current = (signalCfg as any)?.[check.id] !== false;
              updateConfig({ [check.id]: !current });
            }}
            className={`group relative p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
              (signalCfg as any)?.[check.id] !== false
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-500'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <span className="text-[10px] font-bold uppercase">
              {check.label}
            </span>
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                (signalCfg as any)?.[check.id] !== false
                  ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                  : 'bg-slate-800'
              }`}
            />
            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] text-slate-400 z-50 shadow-2xl normal-case">
              {check.tip}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
