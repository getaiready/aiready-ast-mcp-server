import { Suspense } from 'react';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#0a0a0f] flex flex-col items-center justify-center p-8">
      {/* ... (background effects) */}
      <div className="relative z-10 max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-3 gradient-text-animated">
            Welcome to AIReady
          </h1>
          <p className="text-slate-400 text-lg">
            Sign in to track your codebase AI readiness
          </p>
        </div>

        <div className="glass-card p-8 rounded-2xl">
          <Suspense
            fallback={
              <div className="h-40 animate-pulse bg-slate-800/50 rounded-xl" />
            }
          >
            <LoginForm />
          </Suspense>

          <p className="text-center text-sm text-slate-500 mt-6">
            By signing in, you agree to our{' '}
            <a
              href="/terms"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Privacy Policy
            </a>
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            New to AIReady?{' '}
            <a
              href="https://getaiready.dev"
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Learn more
            </a>
          </p>
        </div>

        {/* Features preview */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          {[
            {
              icon: (
                <svg
                  className="w-6 h-6 text-cyan-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              ),
              label: 'Track Trends',
            },
            {
              icon: (
                <svg
                  className="w-6 h-6 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              ),
              label: 'Benchmark',
            },
            {
              icon: (
                <svg
                  className="w-6 h-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              ),
              label: 'AI Insights',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="text-center p-4 rounded-xl bg-slate-800/30 border border-slate-700/50"
            >
              <div className="flex justify-center mb-2">{item.icon}</div>
              <div className="text-xs text-slate-400">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
