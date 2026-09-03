'use client';

import { upload } from '@vercel/blob/client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import type { Building } from '@/lib/types';

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';
const MAX_BYTES = 8 * 1024 * 1024;

// Styling for input field labels
const FIELD_LABEL = 'block text-sm font-medium text-slate-700';

// Common input styling
const TEXT_INPUT = [
  'mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm',
  'focus:border-slate-900 focus:ring-1 focus:ring-slate-900',
  'disabled:opacity-50',
].join(' ');

// Style file input's native browser button
const FILE_INPUT = [
  'mt-1 w-full rounded-md border border-slate-300 p-2 text-sm',
  'file:mr-3 file:rounded file:border-0 file:bg-slate-900 file:px-3 file:py-1.5',
  'file:text-white file:transition file:hover:bg-slate-800',
  'disabled:opacity-50',
].join(' ');

/** Dims while the upload is in flight, matching the disabled inputs. */
const SUBMIT_BUTTON = [
  'rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white',
  'transition hover:bg-slate-800',
  'disabled:opacity-50',
].join(' ');

type Status = { kind: 'idle' | 'uploading' | 'done' | 'error'; message?: string };

export default function PhotoUploadForm({ buildings }: { buildings: Building[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [buildingId, setBuildingId] = useState(buildings[0]?.id ?? '');
  const [caption, setCaption] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = fileRef.current?.files?.[0];

    // Client-side check for a friendly message; server validates again anyway
    if (!file) return setStatus({ kind: 'error', message: 'Choose an image first.' });
    if (!ACCEPT.split(',').includes(file.type)) {
      return setStatus({ kind: 'error', message: 'Use a JPEG, PNG, WebP, or AVIF image.' });
    }
    if (file.size > MAX_BYTES) {
      return setStatus({ kind: 'error', message: 'Image must be under 8 MB.' });
    }

    setStatus({ kind: 'uploading' });

    try {
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
      const blob = await upload(`buildings/${buildingId}/hero.${extension}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/photos/upload',
        clientPayload: caption,
      });

      const response = await fetch('/api/admin/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buildingId,
          url: blob.url,
          pathname: blob.pathname,
          caption,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json().catch(() => ({ error: 'Save failed' }));
        throw new Error(error);
      }

      setStatus({ kind: 'done', message: 'Photo published.' });
      setCaption('');
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Upload failed.',
      });
    }
  }

  const busy = status.kind === 'uploading';

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div>
        <label htmlFor="building" className={FIELD_LABEL}>
          Building
        </label>
        <select
          id="building"
          value={buildingId}
          onChange={(e) => setBuildingId(e.target.value)}
          disabled={busy}
          className={TEXT_INPUT}
        >
          {buildings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="photo" className={FIELD_LABEL}>
          Landmark photo
        </label>
        <input
          ref={fileRef}
          id="photo"
          type="file"
          accept={ACCEPT}
          required
          disabled={busy}
          aria-describedby="photo-hint"
          className={FILE_INPUT}
        />
        <p id="photo-hint" className="mt-1 text-xs text-slate-500">
          Landscape shot of the main entrance works best. Max 8 MB. Replaces the current photo.
        </p>
      </div>

      <div>
        <label htmlFor="caption" className={FIELD_LABEL}>
          Caption <span className="font-normal text-slate-500">(used as alt text)</span>
        </label>
        <input
          id="caption"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={busy}
          maxLength={200}
          placeholder="Main entrance facing Corrales Avenue"
          className={TEXT_INPUT}
        />
      </div>

      <button type="submit" disabled={busy} className={SUBMIT_BUTTON}>
        {busy ? 'Uploading…' : 'Publish photo'}
      </button>

      {/* aria-live so the outcome reaches a screen reader without a focus move. */}
      {status.message && (
        <p
          role="status"
          aria-live="polite"
          className={`text-sm ${status.kind === 'error' ? 'text-red-600' : 'text-emerald-700'}`}
        >
          {status.message}
        </p>
      )}
    </form>
  );
}
