'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  RocketIcon,
  ChartIcon,
  TargetIcon,
  RobotIcon,
} from '@/components/Icons';

const words = ['AI-Ready', 'Optimized', 'Monitored', 'Efficient'];

const features = [
  {
    icon: <ChartIcon className="w-7 h-7 text-white" />,
    title: 'Track Trends',
    description:
      'Monitor AI readiness scores over time with detailed historical data and beautiful visualizations',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <TargetIcon className="w-7 h-7 text-white" />,
    title: 'Benchmark',
    description:
      'Compare your codebase against similar projects and industry standards',
    gradient: 'from-cyan-500 to-purple-500',
  },
  {
    icon: <RobotIcon className="w-7 h-7 text-white" />,
    title: 'AI Insights',
    description:
      'Get actionable recommendations to improve AI comprehension and code quality',
    gradient: 'from-purple-500 to-pink-500',
  },
];

export default function HomePage() {
  const [currentWord, setCurrentWord] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0a0f]">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="orb orb-blue w-96 h-96 -top-48 -left-48"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="orb orb-cyan w-80 h-80 top-1/4 -right-40"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="orb orb-purple w-72 h-72 bottom-0 left-1/4"
          style={{ animationDelay: '4s' }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-50" />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-radial-glow" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-gradient-to-r from-blue-900/50 to-cyan-900/50 text-cyan-300 text-sm font-medium rounded-full border border-cyan-500/30 shadow-lg"
          >
            <motion.span
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              <RocketIcon className="w-5 h-5 text-cyan-300" />
            </motion.span>
            <span>Platform Dashboard</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight"
          >
            Make Your Codebase <br />
            <motion.span
              key={currentWord}
              initial={{ opacity: 0, y: 20, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: -20, rotateX: 90 }}
              transition={{ duration: 0.5 }}
              className="inline-block gradient-text-animated"
            >
              {words[currentWord]}
            </motion.span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-2xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            <span className="font-semibold text-white">
              Monitor, analyze, and improve your codebase AI readiness.
            </span>
            <br />
            <span className="text-cyan-400">
              Sign in to track multiple repositories and benchmark your
              progress.
            </span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <motion.a
              href="/login"
              whileHover={{
                scale: 1.05,
                boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)',
              }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary inline-flex items-center justify-center gap-2 text-lg"
            >
              Sign in with GitHub
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.a>
            <motion.a
              href="https://www.npmjs.com/package/@aiready/cli"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary inline-flex items-center justify-center gap-2 text-lg"
            >
              <span>📦</span>
              View on npm
            </motion.a>
          </motion.div>

          {/* Features grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="glass-card rounded-2xl p-6 text-left card-hover"
              >
                <div
                  className={`text-4xl mb-4 inline-block p-3 rounded-xl bg-gradient-to-br ${feature.gradient} bg-opacity-20`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* CLI Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="mt-16 text-left max-w-3xl mx-auto"
          >
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
              {/* Terminal dots */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-sm text-slate-500 font-mono">
                  terminal
                </span>
              </div>

              <div className="space-y-2 font-mono text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-green-400">$</span>
                  <motion.code
                    initial={{ width: 0 }}
                    animate={{ width: 'auto' }}
                    transition={{ duration: 1.5, delay: 1.2 }}
                    className="text-cyan-400 overflow-hidden whitespace-nowrap"
                  >
                    npx @aiready/cli scan . --output json
                  </motion.code>
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-cyan-400"
                  >
                    |
                  </motion.span>
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5 }}
                  className="text-slate-400 space-y-1 pl-4"
                >
                  <div>✓ Analyzing codebase...</div>
                  <div>✓ Found 42 semantic duplicates</div>
                  <div>✓ Identified 15 optimization opportunities</div>
                  <div className="text-emerald-400">
                    ✓ Report saved to report.json
                  </div>
                </motion.div>
              </div>

              {/* Animated glow */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <footer className="w-full max-w-5xl mx-auto mt-20 pt-8 pb-12 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-slate-500">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                AR
              </div>
              <span className="font-bold text-white tracking-wider uppercase text-xs">
                AIReady Platform
              </span>
            </div>
            <p>© {new Date().getFullYear()} AIReady. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a
              href="/privacy"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              Privacy Policy
            </a>
            <a
              href="/terms"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              Terms of Service
            </a>
            <a
              href="https://getaiready.dev"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              Main Site
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
