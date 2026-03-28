import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalPage({
  title,
  lastUpdated,
  children,
}: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-mono uppercase tracking-widest mb-12 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="flex items-center gap-4 mb-12">
          <Image
            src="/logo.png"
            alt="ClawMore"
            width={40}
            height={40}
            className="opacity-50"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter">
              {title}
            </h1>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
              Last updated: {lastUpdated}
            </p>
          </div>
        </div>

        <div className="legal-content text-zinc-400 text-sm leading-relaxed space-y-6">
          {children}
        </div>

        <div className="mt-16 pt-8 border-t border-white/5">
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest text-center">
            &copy; 2026 ClawMore. All rights reserved.
          </p>
        </div>
      </div>

      <style>{`
        .legal-content h2 {
          color: #ffffff;
          font-size: 1.125rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        .legal-content p {
          margin-bottom: 1rem;
        }
        .legal-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .legal-content li {
          margin-bottom: 0.5rem;
        }
        .legal-content a {
          color: #00e0ff;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
