'use client';

import { AnimatePresence } from 'framer-motion';
import { TrendsView } from '../TrendsView';

interface TrendsModalProps {
  repo: { id: string; name: string } | null;
  onClose: () => void;
}

export function TrendsModal({ repo, onClose }: TrendsModalProps) {
  return (
    <AnimatePresence>
      {repo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <TrendsView repoId={repo.id} repoName={repo.name} onClose={onClose} />
        </div>
      )}
    </AnimatePresence>
  );
}
