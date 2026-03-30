'use client';

export function InsightCard({
  title,
  value,
  description,
  trend,
}: {
  title: string;
  value: string;
  description: string;
  trend: 'up' | 'down';
}) {
  return (
    <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 flex items-start gap-4 text-white">
      <div
        className={`p-3 rounded-2xl ${trend === 'up' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}
      >
        {trend === 'up' ? '↗' : '↘'}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
          {title}
        </p>
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      </div>
    </div>
  );
}
