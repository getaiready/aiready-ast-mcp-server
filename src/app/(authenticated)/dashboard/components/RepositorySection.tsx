'use client';

import { AnimatePresence } from 'framer-motion';
import { RocketIcon } from '@/components/Icons';
import { RepoCard } from './RepoCard';

interface RepositorySectionProps {
  repos: any[];
  onAddRepo: () => void;
  uploadingRepoId: string | null;
  scanningRepoId: string | null;
  pendingScanRepoIds: string[];
  onUpload: (id: string) => void;
  onScan: (id: string) => void;
  onDelete: (id: string) => void;
  onBadge: (repo: { id: string; name: string }) => void;
}

export function RepositorySection({
  repos,
  onAddRepo,
  uploadingRepoId,
  scanningRepoId,
  pendingScanRepoIds,
  onUpload,
  onScan,
  onDelete,
  onBadge,
}: RepositorySectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Repositories</h2>
        <button
          onClick={onAddRepo}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all"
        >
          <span className="text-lg leading-none">+</span> Add Repository
        </button>
      </div>

      {repos.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="mb-6 inline-block text-6xl text-slate-50">
            <RocketIcon className="w-14 h-14" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            Get Started with AIReady
          </h3>
          <p className="text-slate-400 max-w-md mx-auto mb-8">
            Add a repository, run the CLI, then upload the results to get your
            AI readiness score.
          </p>
          <button onClick={onAddRepo} className="mt-8 btn-primary">
            Add Your First Repository
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence>
            {repos.map((repo, index) => (
              <RepoCard
                key={repo.id}
                repo={repo}
                index={index}
                uploading={uploadingRepoId === repo.id}
                scanning={
                  scanningRepoId === repo.id ||
                  pendingScanRepoIds.includes(repo.id)
                }
                onUpload={() => onUpload(repo.id)}
                onScan={() => onScan(repo.id)}
                onDelete={() => onDelete(repo.id)}
                onBadge={() => onBadge({ id: repo.id, name: repo.name })}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}
