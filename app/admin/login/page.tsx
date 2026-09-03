'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Centres the card in the viewport whatever the screen height. */
const SCREEN = 'grid min-h-[100dvh] place-items-center bg-slate-50 p-6';

/** Field label. Paired with `htmlFor` so tapping the text focuses the input. */
const FIELD_LABEL = 'block text-sm font-medium text-slate-700';

/**
 * Admin styling is intentionally plain slate, not themed — this screen is for
 * staff, and it should look the same no matter which theme visitors picked.
 */
const TEXT_INPUT = [
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm',
  'focus:border-slate-900 focus:ring-1 focus:ring-slate-900',
  'disabled:opacity-50',
].join(' ');

/** Dims while the request is in flight, matching the disabled inputs. */
const SUBMIT_BUTTON = [
  'w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white',
  'transition hover:bg-slate-800',
  'disabled:opacity-50',
].join(' ');

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: 'Login failed' }));
        throw new Error(error);
      }

      router.push('/admin/photos');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setBusy(false);
    }
  }

  return (
    <div className={SCREEN}>
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Admin login</h1>
          <p className="text-sm text-slate-600">Xavier University Campus Map</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className={FIELD_LABEL}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={busy}
              autoFocus
              className={TEXT_INPUT}
            />
          </div>

          <button type="submit" disabled={busy} className={SUBMIT_BUTTON}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          {/* role="alert" so a failed attempt is announced, not just shown. */}
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
