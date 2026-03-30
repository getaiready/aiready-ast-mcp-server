'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="orb orb-blue w-96 h-96 -top-48 -right-48"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="orb orb-purple w-80 h-80 bottom-0 -left-40"
          style={{ animationDelay: '3s' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"
          />
        </div>
        <p className="mt-4 text-slate-400 text-sm">Loading...</p>
      </motion.div>
    </div>
  );
}
