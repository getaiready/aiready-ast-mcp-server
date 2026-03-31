'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#0a0a0f]/80 backdrop-blur-md border-t border-slate-800/50 py-12 px-8 relative z-20">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start gap-3 text-center md:text-left">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-[12px] font-bold text-white shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
              AR
            </div>
            <span className="font-bold text-white tracking-wider uppercase text-sm group-hover:text-cyan-400 transition-colors">
              AIReady Platform
            </span>
          </Link>
          <p className="text-sm text-slate-500 max-w-xs">
            The central hub for tracking and monitoring codebase AI-readiness.
            Monitor trends, benchmark repositories, and get actionable insights.
          </p>
          <p className="text-xs text-slate-600">
            © {currentYear} AIReady. All rights reserved.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-x-12 gap-y-6">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Legal & Compliance
            </span>
            <div className="flex flex-col gap-2">
              <Link
                href="/privacy"
                className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5 group"
              >
                <div className="w-1 h-1 rounded-full bg-cyan-500/50 group-hover:bg-cyan-400 transition-colors" />
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5 group"
              >
                <div className="w-1 h-1 rounded-full bg-cyan-500/50 group-hover:bg-cyan-400 transition-colors" />
                Terms of Service
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Resources
            </span>
            <div className="flex flex-col gap-2">
              <Link
                href="/metrics"
                className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5 group"
              >
                <div className="w-1 h-1 rounded-full bg-cyan-500/50 group-hover:bg-cyan-400 transition-colors" />
                Global Metrics
              </Link>
              <a
                href="https://getaiready.dev"
                className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5 group"
              >
                <div className="w-1 h-1 rounded-full bg-cyan-500/50 group-hover:bg-cyan-400 transition-colors" />
                Main Site
              </a>
              <a
                href="https://github.com/caopengau/aiready-cli"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-500 hover:text-cyan-400 transition-colors flex items-center gap-1.5 group"
              >
                <div className="w-1 h-1 rounded-full bg-cyan-500/50 group-hover:bg-cyan-400 transition-colors" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-800/30 text-center">
        <p className="text-[10px] text-slate-700 uppercase tracking-[0.2em]">
          Built for the future of multi-human multi-agent collaboration
        </p>
      </div>
    </footer>
  );
}
