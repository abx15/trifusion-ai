'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export default function PlatformLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch('/api/backend/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          email: String(formData.get('email') ?? ''),
          password: String(formData.get('password') ?? ''),
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = result && typeof result === 'object' && 'message' in result && typeof result.message === 'string'
          ? result.message
          : 'Sign in failed.';
        throw new Error(message);
      }
      const nextPath = new URLSearchParams(window.location.search).get('next');
      const protectedPaths = ['/', '/audit', '/analytics', '/users', '/settings'];
      router.replace(nextPath && protectedPaths.includes(nextPath) ? nextPath : '/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Sign in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form
        onSubmit={(event) => void submit(event)}
        className="w-full max-w-md space-y-5 rounded-xl border bg-white p-6 shadow-sm sm:p-8"
      >
        <header>
          <p className="text-sm font-semibold text-blue-700">TriFusion AI</p>
          <h1 className="mt-2 text-2xl font-semibold">Platform staff sign in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Access is checked by the NestJS platform authorization policy after sign in.
          </p>
        </header>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <label className="block space-y-2 text-sm font-medium" htmlFor="email">
          Email
          <input id="email" name="email" type="email" required autoComplete="username" className="h-10 w-full rounded-md border px-3 font-normal" />
        </label>
        <label className="block space-y-2 text-sm font-medium" htmlFor="password">
          Password
          <input id="password" name="password" type="password" required autoComplete="current-password" className="h-10 w-full rounded-md border px-3 font-normal" />
        </label>
        <button type="submit" disabled={submitting} className="w-full rounded-md bg-blue-700 px-4 py-2.5 font-medium text-white hover:bg-blue-800 disabled:opacity-60">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
