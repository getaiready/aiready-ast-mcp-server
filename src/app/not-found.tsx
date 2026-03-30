'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring' }}
          className="text-8xl font-black bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent mb-4"
        >
          404
        </motion.div>
        <h1 className="text-2xl font-bold text-white mb-3">Page not found</h1>
        <p className="text-slate-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 border border-slate-600 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
