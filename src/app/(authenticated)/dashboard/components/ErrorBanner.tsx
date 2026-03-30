'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ErrorBannerProps {
  error: string | null;
  onClear: () => void;
}

export function ErrorBanner({ error, onClear }: ErrorBannerProps) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-red-900/30 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl flex justify-between items-center"
        >
          <span>{error}</span>
          <button
            onClick={onClear}
            className="ml-4 font-bold text-xl leading-none hover:text-red-100"
          >
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
