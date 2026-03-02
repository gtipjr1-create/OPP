'use client';

import * as React from 'react';
import { OppMark } from '@/components/OppMark';

export default function LoginPage() {
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Keep your existing auth logic here.
    // If you already had handlers in this file, paste them back in and wire them to this form.
  }

  return (
    <main className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      {/* Premium backdrop */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-[-260px] right-[-220px] h-[620px] w-[620px] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black/90" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md items-center justify-center px-5">
        <section className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          {/* Brand */}
          <div className="mb-6 flex flex-col items-center text-center">
 <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/10">
  <OppMark size={28} />
</div>

            <h1 className="text-2xl font-semibold tracking-tight">OPP</h1>
            <p className="mt-1 text-sm text-white/60">Plan deliberately. Execute daily.</p>
          </div>

          {/* Tabs */}
          <div className="mb-5 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={[
                'h-10 rounded-lg text-sm font-medium transition',
                mode === 'signin'
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white/90 hover:bg-white/5',
              ].join(' ')}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={[
                'h-10 rounded-lg text-sm font-medium transition',
                mode === 'signup'
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white/90 hover:bg-white/5',
              ].join(' ')}
            >
              Sign up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-white/70">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/25 focus:bg-black/55"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-white/70">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-white/25 focus:bg-black/55"
              />
            </div>

            <button
              type="submit"
              className="mt-2 h-11 w-full rounded-xl bg-white text-sm font-medium text-black transition hover:bg-white/90 active:scale-[0.99]"
            >
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>

            {/* Secondary actions */}
            <div className="flex items-center justify-between pt-1">
              <button type="button" className="text-xs text-white/55 hover:text-white/80">
                Forgot password?
              </button>
              <button type="button" className="text-xs text-white/55 hover:text-white/80">
                Need help?
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}