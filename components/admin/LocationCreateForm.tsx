'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { BuildingCategory } from '@/lib/types';
import { CAMPUS_COORDINATE_LIMITS, LOCATION_CATEGORIES } from '@/lib/location-config';

const FIELD_LABEL = 'block text-sm font-medium text-slate-700';
const TEXT_INPUT = 'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:ring-1 focus:ring-slate-900 disabled:opacity-50';
const SUBMIT_BUTTON = 'rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50';

const CATEGORY_LABELS: Record<BuildingCategory, string> = {
  academic: 'Academic',
  admin: 'Administration',
  'student-life': 'Student life',
  chapel: 'Chapel',
  sports: 'Sports',
  service: 'Service',
  landmark: 'Landmark',
};

export default function LocationCreateForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [category, setCategory] = useState<BuildingCategory>('landmark');
  const [longitude, setLongitude] = useState('124.6469');
  const [latitude, setLatitude] = useState('8.4766');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' | 'done' | 'error'; message?: string }>({ kind: 'idle' });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: 'saving' });
    try {
      const response = await fetch('/api/admin/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, aliases, category, longitude, latitude, description }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? 'Could not create location.');
      setStatus({ kind: 'done', message: `Location created. Upload its image below.` });
      setName('');
      setAliases('');
      setDescription('');
      router.refresh();
    } catch (error) {
      setStatus({ kind: 'error', message: error instanceof Error ? error.message : 'Could not create location.' });
    }
  }

  const busy = status.kind === 'saving';

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Add custom location</h2>
        <p className="mt-1 text-sm text-slate-600">Create a game location for a courtyard, sign, pathway, or any other campus spot.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="location-name" className={FIELD_LABEL}>Location name</label>
          <input id="location-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} disabled={busy} placeholder="Founders Walk" className={TEXT_INPUT} />
        </div>
        <div>
          <label htmlFor="location-category" className={FIELD_LABEL}>Category</label>
          <select id="location-category" value={category} onChange={(event) => setCategory(event.target.value as BuildingCategory)} disabled={busy} className={TEXT_INPUT}>
            {LOCATION_CATEGORIES.map((value) => <option key={value} value={value}>{CATEGORY_LABELS[value]}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="location-aliases" className={FIELD_LABEL}>Aliases <span className="font-normal text-slate-500">(comma-separated)</span></label>
          <input id="location-aliases" value={aliases} onChange={(event) => setAliases(event.target.value)} disabled={busy} placeholder="Founders, Walkway" className={TEXT_INPUT} />
        </div>
        <div>
          <label htmlFor="location-latitude" className={FIELD_LABEL}>Latitude</label>
          <input id="location-latitude" type="number" step="any" min={CAMPUS_COORDINATE_LIMITS.minLatitude} max={CAMPUS_COORDINATE_LIMITS.maxLatitude} value={latitude} onChange={(event) => setLatitude(event.target.value)} required disabled={busy} className={TEXT_INPUT} />
        </div>
        <div>
          <label htmlFor="location-longitude" className={FIELD_LABEL}>Longitude</label>
          <input id="location-longitude" type="number" step="any" min={CAMPUS_COORDINATE_LIMITS.minLongitude} max={CAMPUS_COORDINATE_LIMITS.maxLongitude} value={longitude} onChange={(event) => setLongitude(event.target.value)} required disabled={busy} className={TEXT_INPUT} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="location-description" className={FIELD_LABEL}>Description <span className="font-normal text-slate-500">(optional)</span></label>
          <textarea id="location-description" value={description} onChange={(event) => setDescription(event.target.value)} disabled={busy} maxLength={500} rows={3} placeholder="A shaded path beside the university church" className={TEXT_INPUT} />
        </div>
      </div>

      <button type="submit" disabled={busy} className={SUBMIT_BUTTON}>{busy ? 'Creating…' : 'Create location'}</button>
      {status.message && <p role="status" aria-live="polite" className={`text-sm ${status.kind === 'error' ? 'text-red-600' : 'text-emerald-700'}`}>{status.message}</p>}
    </form>
  );
}
