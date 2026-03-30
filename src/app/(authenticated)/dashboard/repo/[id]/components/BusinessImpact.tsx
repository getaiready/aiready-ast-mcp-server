'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import * as Icons from '@/components/Icons';

// Fail-safe icon helper
const Icon = ({ name, className }: { name: string; className?: string }) => {
  const SvgIcon = (Icons as any)[name];
  if (!SvgIcon) {
    return <div className={className + ' bg-slate-800 rounded-sm'} />;
  }
  return <SvgIcon className={className} />;
};

interface BusinessImpactProps {
  businessImpact?: {
    estimatedMonthlyWaste: number;
    potentialSavings: number;
    productivityHours: number;
  };
  aiScore: number;
}

export function BusinessImpact({
  businessImpact,
  aiScore: _aiScore,
}: BusinessImpactProps) {
  if (!businessImpact) return null;

  const { estimatedMonthlyWaste, potentialSavings, productivityHours } =
    businessImpact;

  // Predict annual ROI based on monthly savings
  const annualSavings = potentialSavings * 12;
  const showUpgradeHero = potentialSavings > 500; // Trigger for Pro tier upsell

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Monthly Waste Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-3xl border border-red-500/10 bg-red-500/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon name="WalletIcon" className="w-12 h-12 text-red-500" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-red-400 mb-1">
            Context Waste
          </p>
          <h4 className="text-3xl font-bold text-white mb-2">
            ${estimatedMonthlyWaste.toLocaleString()}
            <span className="text-sm font-normal text-slate-500 ml-2">
              / month
            </span>
          </h4>
          <p className="text-sm text-slate-400">
            Estimated cost of redundant or fragmented context window
            consumption.
          </p>
        </motion.div>

        {/* Potential Savings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-3xl border border-green-500/10 bg-green-500/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon name="TrendingUpIcon" className="w-12 h-12 text-green-500" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-green-400 mb-1">
            Potential ROI
          </p>
          <h4 className="text-3xl font-bold text-white mb-2">
            ${potentialSavings.toLocaleString()}
            <span className="text-sm font-normal text-slate-500 ml-2">
              / month
            </span>
          </h4>
          <p className="text-sm text-slate-400">
            Retrievable cost by implementing recommended agentic remediations.
          </p>
        </motion.div>

        {/* Productivity Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-3xl border border-cyan-500/10 bg-cyan-500/5 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icon name="ClockIcon" className="w-12 h-12 text-cyan-500" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-cyan-400 mb-1">
            Velocity Gain
          </p>
          <h4 className="text-3xl font-bold text-white mb-2">
            {productivityHours}h
            <span className="text-sm font-normal text-slate-500 ml-2">
              / month
            </span>
          </h4>
          <p className="text-sm text-slate-400">
            Hours saved per developer through improved AI comprehension and less
            manual context assembling.
          </p>
        </motion.div>
      </div>

      {showUpgradeHero && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-cyan-900/20 to-slate-900 border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-tighter">
              <Icon name="ZapIcon" className="w-3 h-3" />
              Pro Opportunity Detected
            </div>
            <h3 className="text-2xl font-bold text-white">
              Unlock ${annualSavings.toLocaleString()} in annual value
            </h3>
            <p className="text-slate-400 max-w-xl">
              Your repository qualifies for AIReady Pro. Get automated
              remediation tasks directly in your PRs and team benchmarks.
            </p>
          </div>
          <Link
            href="/dashboard/billing"
            className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl font-black text-sm transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
          >
            Upgrade to Pro
          </Link>
        </motion.div>
      )}
    </div>
  );
}
