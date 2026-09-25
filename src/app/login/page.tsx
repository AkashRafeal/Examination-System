'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Lock, Mail, ArrowRight, AlertCircle, User } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<{ name: string; email: string; role: string } | null>(null);

  // Check if already signed in
  React.useEffect(() => {
    async function checkCurrentSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setActiveSession(data.user);
          }
        }
      } catch {
        // Ignore errors
      }
    }
    checkCurrentSession();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setActiveSession(null);
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      if (redirect) {
        window.location.href = redirect;
      } else if (data.user.role === 'ADMIN') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/user/dashboard';
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };


  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign in to ExamPortal
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter your credentials to access your assessment or administration portal
          </p>
        </div>

        {activeSession && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-sm shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-blue-950 text-xs">
                  Already signed in as <span className="underline">{activeSession.name}</span>
                </p>
                <p className="text-[11px] text-blue-700 font-mono mt-0.5">
                  {activeSession.email} · {activeSession.role}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Link
                  href={activeSession.role === 'ADMIN' ? '/admin/dashboard' : '/user/dashboard'}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Go to Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Sign Out
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 border-t border-blue-200/60 pt-2">
              To switch accounts, enter new credentials below or click Sign Out above.
            </p>
          </div>
        )}

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-100">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start text-sm text-rose-700">
              <AlertCircle className="w-5 h-5 mr-2.5 flex-shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="username or name@assessment.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

</div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700 block mb-0.5">Need examination access?</span>
          Candidate accounts are provisioned and distributed exclusively by the examination administrator. Contact your institution administrator if you do not have credentials.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}
