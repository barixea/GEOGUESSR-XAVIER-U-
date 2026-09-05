'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Props = {
  locationId: string;
  locationName: string;
  enabled: boolean;
};

export default function LocationToggle({ locationId, locationName, enabled: initialEnabled }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleToggle() {
    if (saving) return;

    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/locations/${encodeURIComponent(locationId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: nextEnabled }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? 'Could not update location.');
      router.refresh();
    } catch (requestError) {
      setEnabled(!nextEnabled);
      setError(requestError instanceof Error ? requestError.message : 'Could not update location.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-w-[8.5rem] flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold ${enabled ? 'text-emerald-700' : 'text-slate-500'}`}>
          {enabled ? 'Enabled' : 'Disabled'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? 'Disable' : 'Enable'} ${locationName} in the game`}
          onClick={handleToggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 ${enabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
        >
          <span className={`size-5 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
      </div>
      {error && <p className="max-w-[11rem] text-right text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
