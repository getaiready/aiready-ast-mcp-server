'use client';

import { useState } from 'react';
import type { ClientProps as Props } from '@/lib/client-props';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { TrendingUpIcon } from '@/components/Icons';
import PlatformShell from '@/components/PlatformShell';
import WaitingListModal from '@/components/WaitingListModal';
import { plans } from './constants';
import { PricingCard } from './components/PricingCard';
import { PlanSelectionModal } from './components/PlanSelectionModal';
import { toast } from 'sonner';

export default function PricingClient({
  user,
  teams = [],
  overallScore,
}: Props) {
  const [waitlistPlan, setWaitlistPlan] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (plan: string) => {
    const planKey = plan.toLowerCase();

    // Free plan or Enterprise - redirect or contact
    if (planKey === 'free') {
      window.location.href = '/login';
      return;
    }
    if (planKey === 'enterprise') {
      window.location.href = '/contact';
      return;
    }

    // Pro or Team - handle checkout
    if (!user) {
      window.location.href = `/login?redirect=/pricing#${planKey}`;
      return;
    }

    if (teams.length === 0) {
      toast.error('You need to create a team first to upgrade.', {
        description: 'Go to your dashboard to create a team.',
        action: {
          label: 'Go to Dashboard',
          onClick: () => (window.location.href = '/dashboard'),
        },
      });
      return;
    }

    if (teams.length === 1) {
      // Direct checkout for single team
      await startCheckout(teams[0].teamId, planKey);
    } else {
      // Show modal to select team
      setSelectedPlan(plan);
    }
  };

  const startCheckout = async (teamId: string, plan: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'checkout',
          teamId,
          plan: plan.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Failed to start checkout. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <PlatformShell
      user={user ? (user as any) : null}
      teams={teams}
      overallScore={overallScore}
    >
      <div className="py-20 px-4">
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-cyan-900/30 text-cyan-300 text-sm font-medium rounded-full border border-cyan-500/30"
            >
              <TrendingUpIcon className="w-4 h-4" />
              <span>Pricing Plans</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-white mb-6"
            >
              Choose Your <span className="gradient-text-animated">Plan</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-400 max-w-2xl mx-auto"
            >
              Invest in your codebase's AI readiness. Start for free and scale
              as you grow.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => (
              <PricingCard
                key={plan.name}
                plan={plan}
                index={index}
                onJoinWaitlist={setWaitlistPlan}
                onUpgrade={handleUpgrade}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-20 text-center"
          >
            <Link
              href="/dashboard"
              className="text-slate-500 hover:text-cyan-400 flex items-center justify-center gap-2 transition-colors"
            >
              <span>←</span> Back to Dashboard
            </Link>
          </motion.div>
        </div>
      </div>

      <WaitingListModal
        isOpen={!!waitlistPlan}
        onClose={() => setWaitlistPlan(null)}
        planName={waitlistPlan || ''}
      />

      <PlanSelectionModal
        isOpen={!!selectedPlan}
        onClose={() => setSelectedPlan(null)}
        planName={selectedPlan || ''}
        teams={teams}
        onSelectTeam={(teamId) => startCheckout(teamId, selectedPlan || '')}
        isLoading={isLoading}
      />
    </PlatformShell>
  );
}
