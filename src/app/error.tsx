'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

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
        className="relative z-10 max-w-md w-full glass-card rounded-2xl p-8 text-center"
      >
        <div className="text-6xl mb-6">⚠️</div>
        <h1 className="text-2xl font-bold text-white mb-3">
          Something went wrong
        </h1>
        <p className="text-slate-400 mb-6">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        {error.digest && (
          <p className="text-xs text-slate-500 mb-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="px-6 py-2.5 border border-slate-600 text-slate-300 text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </motion.div>
    </div>
  );
}
