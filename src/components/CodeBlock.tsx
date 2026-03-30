'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

interface CodeBlockProps {
  children: string;
  lang?: string;
}

export default function CodeBlock({
  children,
  lang = 'typescript',
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children.trim());
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative font-mono text-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {lang}
        </span>
        <button
          onClick={handleCopy}
          className="text-[10px] font-bold text-cyan-500 hover:text-cyan-400 transition-colors uppercase tracking-widest"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-slate-300 leading-relaxed bg-slate-900/50 whitespace-pre">
        <code>{children.trim()}</code>
      </pre>
    </div>
  );
}
