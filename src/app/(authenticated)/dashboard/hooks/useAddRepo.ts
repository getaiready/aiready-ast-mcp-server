'use client';

import { useState } from 'react';

export function useAddRepo(
  currentTeamId: string,
  setRepos: (fn: (prev: any[]) => any[]) => void
) {
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [addRepoForm, setAddRepoForm] = useState({
    name: '',
    url: '',
    description: '',
    defaultBranch: 'main',
  });
  const [addRepoError, setAddRepoError] = useState<string | null>(null);
  const [addRepoLoading, setAddRepoLoading] = useState(false);

  async function handleAddRepo(e: React.FormEvent) {
    e.preventDefault();
    setAddRepoError(null);
    setAddRepoLoading(true);

    try {
      const res = await fetch('/api/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addRepoForm,
          teamId: currentTeamId === 'personal' ? undefined : currentTeamId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddRepoError(data.error || 'Failed to add repository');
        return;
      }

      const newRepo = { ...data.repo, latestAnalysis: null };
      setRepos((prev) => [newRepo, ...prev]);
      setShowAddRepo(false);
      setAddRepoForm({
        name: '',
        url: '',
        description: '',
        defaultBranch: 'main',
      });
    } catch {
      setAddRepoError('Network error. Please try again.');
    } finally {
      setAddRepoLoading(false);
    }
  }

  return {
    showAddRepo,
    setShowAddRepo,
    addRepoForm,
    setAddRepoForm,
    addRepoError,
    addRepoLoading,
    handleAddRepo,
  };
}
