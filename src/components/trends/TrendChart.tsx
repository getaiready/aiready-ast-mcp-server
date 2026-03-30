'use client';

import { motion } from 'framer-motion';
import { scoreColor } from '@aiready/components';
import type { Analysis } from '@/lib/db';

interface TrendChartProps {
  history: Analysis[];
  height?: number;
  width?: number;
  padding?: number;
  showLabels?: boolean;
}

export function TrendChart({
  history,
  height = 300,
  width = 800,
  padding = 50,
  showLabels = true,
}: TrendChartProps) {
  const scores = history.map((h) => h.aiScore || 0);
  const maxScore = 100;

  const points = scores.map((score, i) => {
    const x = padding + (i * (width - 2 * padding)) / (scores.length - 1 || 1);
    const y = height - padding - (score * (height - 2 * padding)) / maxScore;
    return { x, y, score };
  });

  const pathD =
    points.length > 0
      ? `M ${points[0].x} ${points[0].y} ` +
        points
          .slice(1)
          .map((p) => `L ${p.x} ${p.y}`)
          .join(' ')
      : '';

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.2)" />
            <stop offset="100%" stopColor="rgba(34, 211, 238, 0)" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {[0, 25, 50, 75, 100].map((level) => (
          <g key={level}>
            <line
              x1={padding}
              y1={height - padding - (level * (height - 2 * padding)) / 100}
              x2={width - padding}
              y2={height - padding - (level * (height - 2 * padding)) / 100}
              className="stroke-slate-800/50"
              strokeWidth="1"
            />
            <text
              x={padding - 15}
              y={height - padding - (level * (height - 2 * padding)) / 100}
              className="text-[10px] fill-slate-500 font-mono"
              textAnchor="end"
              alignmentBaseline="middle"
            >
              {level}
            </text>
          </g>
        ))}

        {/* Fill */}
        <path
          d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
          fill="url(#trendGradient)"
        />

        {/* Path */}
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          d={pathD}
          fill="none"
          stroke="rgba(34, 211, 238, 0.8)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {points.map((p, i) => (
          <g key={i} className="group/dot">
            <circle
              cx={p.x}
              cy={p.y}
              r="6"
              className={`fill-slate-950 stroke-[3] transition-all duration-300 ${scoreColor(p.score).replace('text', 'stroke')}`}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r="12"
              className="fill-transparent cursor-help"
            />
            <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity">
              <rect
                x={p.x - 20}
                y={p.y - 35}
                width="40"
                height="24"
                rx="6"
                className="fill-slate-800 stroke-slate-700"
              />
              <text
                x={p.x}
                y={p.y - 18}
                textAnchor="middle"
                className="text-xs font-bold fill-white"
              >
                {p.score}
              </text>
            </g>
          </g>
        ))}
      </svg>
      {showLabels && (
        <div className="flex justify-between mt-4 px-[50px] text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <span>History Start</span>
          <span>Current Status</span>
        </div>
      )}
    </div>
  );
}
