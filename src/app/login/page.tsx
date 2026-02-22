'use client';

import { useState } from 'react';

import { createSupabaseBrowserClient } from '@/lib/supabaseBrowser';

const supabase = createSupabaseBrowserClient();

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMsg(null);

    const { error } = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg('Success. Go back to the app.');
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-6 text-white bg-black">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3">
        <h1 className="text-2xl font-bold">OPP</h1>

        <input
          className="w-full px-4 py-3 border rounded-xl bg-zinc-900 border-zinc-800"
          placeholder="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoCapitalize="none"
          autoComplete="email"
        />
        <input
          className="w-full px-4 py-3 border rounded-xl bg-zinc-900 border-zinc-800"
          placeholder="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
        />

        <button type="submit" className="w-full py-3 font-semibold text-black bg-white rounded-xl">
          {isSignup ? 'Create account' : 'Sign in'}
        </button>

        <button
          type="button"
          className="w-full py-3 border rounded-xl bg-zinc-900 border-zinc-800"
          onClick={() => setIsSignup((value) => !value)}
        >
          Switch to {isSignup ? 'Sign in' : 'Sign up'}
        </button>

        {msg ? <p className="text-sm text-zinc-400">{msg}</p> : null}
      </form>
    </main>
  );
}
