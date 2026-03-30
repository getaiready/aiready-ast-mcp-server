'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error');
      setError('No token provided');
      return;
    }

    // Verify the magic link token
    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then(async (data) => {
        if (data.success && data.user) {
          // Create NextAuth session using magic-link provider
          const result = await signIn('magic-link', {
            userId: data.user.id,
            email: data.user.email,
            redirect: false,
          });

          if (result?.ok) {
            setStatus('success');
            setTimeout(() => {
              router.push('/dashboard');
            }, 1500);
          } else {
            setStatus('error');
            setError('Failed to create session');
          }
        } else {
          setStatus('error');
          setError(data.error || 'Verification failed');
        }
      })
      .catch(() => {
        setStatus('error');
        setError('Network error. Please try again.');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-8 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <h1 className="text-xl font-semibold text-white mb-2">
              Verifying your link...
            </h1>
            <p className="text-slate-400">Please wait while we sign you in.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Success!</h1>
            <p className="text-slate-400">Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">
              Verification Failed
            </h1>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Back to Login
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
