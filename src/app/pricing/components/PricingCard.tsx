'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface PricingCardProps {
  plan: any;
  index: number;
  onJoinWaitlist: (planName: string) => void;
  onUpgrade: (planName: string) => void;
}

export function PricingCard({
  plan,
  index,
  onJoinWaitlist,
  onUpgrade,
}: PricingCardProps) {
  const isWaitlist = plan.cta === 'Join Waitlist';
  const isAvailable = plan.available;
  const isExternal = plan.href && plan.href !== '#';

  const handleAction = () => {
    if (isWaitlist) {
      onJoinWaitlist(plan.name);
    } else if (isAvailable && !isExternal) {
      onUpgrade(plan.name);
    }
  };

  return (
    <motion.div
      key={plan.name}
      id={plan.name.toLowerCase()}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 * index }}
      whileHover={{ y: -8 }}
      className={`glass-card rounded-3xl p-8 flex flex-col relative ${
        plan.featured
          ? 'border-cyan-500/50 shadow-cyan-500/20 shadow-2xl scale-105 z-20'
          : ''
      }`}
    >
      {plan.featured && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Most Popular
        </div>
      )}
      {!plan.available && plan.name !== 'Enterprise' && (
        <div className="absolute top-4 right-4 bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
          Coming Soon
        </div>
      )}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-white">{plan.price}</span>
          {plan.price !== 'Custom' && (
            <span className="text-slate-500 text-sm">/month</span>
          )}
        </div>
        <p className="mt-4 text-slate-400 text-sm leading-relaxed">
          {plan.description}
        </p>
      </div>

      <div className="flex-grow space-y-4 mb-8">
        {plan.features.map((feature: string) => (
          <div key={feature} className="flex items-start gap-3 text-sm">
            <div
              className={`mt-1 p-0.5 rounded-full ${plan.featured ? 'bg-cyan-500' : 'bg-slate-700'}`}
            >
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <span
              className={
                feature.includes('plus')
                  ? 'text-cyan-400 font-medium'
                  : 'text-slate-300'
              }
            >
              {feature}
            </span>
          </div>
        ))}
      </div>

      {!isExternal ? (
        <button
          onClick={handleAction}
          className={`w-full text-center py-3 rounded-xl font-bold transition-all ${
            plan.featured
              ? 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
          }`}
        >
          {plan.cta}
        </button>
      ) : (
        <Link
          href={plan.href}
          className={`w-full text-center py-3 rounded-xl font-bold transition-all ${
            plan.featured
              ? 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
          }`}
        >
          {plan.cta}
        </Link>
      )}
    </motion.div>
  );
}
