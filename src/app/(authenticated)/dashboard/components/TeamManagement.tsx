'use client';

import { useState, useEffect, useCallback } from 'react';

export function TeamManagement({
  teamId,
  teamName,
}: {
  teamId: string;
  teamName: string;
}) {
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/teams?teamId=${teamId}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
      }
    } catch (_err) {
      console.error('Failed to fetch members:', _err);
    }
  }, [teamId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, email: inviteEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setInviteEmail('');
        fetchMembers();
      } else {
        setError(data.error || 'Failed to invite member');
      }
    } catch (_err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass-card rounded-2xl p-6 space-y-6 border border-purple-500/10">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">
          Team Management: {teamName}
        </h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
            Invite Member
          </h3>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-all disabled:opacity-50 shadow-lg shadow-purple-600/20"
            >
              {loading ? 'Sending...' : 'Invite'}
            </button>
          </form>
          {error && (
            <p className="text-red-400 text-xs mt-3 font-medium">{error}</p>
          )}
          <p className="text-[10px] text-slate-500 mt-2">
            Note: Users must have logged into AIReady at least once to be
            discovered.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
            Team Members
          </h3>
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between bg-slate-800/30 p-3 rounded-xl border border-slate-700/30"
              >
                <div className="flex items-center gap-3">
                  {m.user?.image ? (
                    <img
                      src={m.user.image}
                      alt={m.user.name || 'Member avatar'}
                      className="w-8 h-8 rounded-full border border-slate-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] text-white">
                      {m.user?.name?.[0] || m.user?.email?.[0]}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-white">
                      {m.user?.name || m.user?.email}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-black">
                      {m.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
