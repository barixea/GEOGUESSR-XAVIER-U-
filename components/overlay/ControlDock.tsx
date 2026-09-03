'use client';

import ViewModeToggle from './ViewModeToggle';

type Props = {
  mode: '2d' | '3d';
  onModeChange: (mode: '2d' | '3d') => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
};

// Bottom-right cluster of map controls (zoom, view mode, locate)
const DOCK = 'absolute bottom-6 right-3 z-10 flex flex-col items-end gap-2 sm:bottom-8 sm:right-4';

// Shared floating card style
const FLOATING = 'rounded-lg shadow-md ring-1 ring-black/10';

// Zoom buttons share one rounded card
const ZOOM_GROUP = `flex flex-col overflow-hidden ${FLOATING}`;

// Divider between zoom in/out buttons
const ZOOM_DIVIDER = 'border-b border-slate-200';

// 40px thumb-friendly buttons with hover and focus states
const BUTTON = [
  'grid size-10 place-items-center',
  'bg-white text-slate-700',
  'transition hover:bg-slate-100',
  'focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand',
  'disabled:cursor-default disabled:text-slate-300 disabled:hover:bg-white',
].join(' ');

// Map controls: view mode, zoom, locate — all in one styled cluster
export default function ControlDock({
  mode,
  onModeChange,
  onZoomIn,
  onZoomOut,
  onLocate,
  canZoomIn,
  canZoomOut,
}: Props) {
  return (
    <div className={DOCK}>
      <ViewModeToggle mode={mode} onChange={onModeChange} />

      <div className={ZOOM_GROUP}>
        <button
          type="button"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          aria-label="Zoom in"
          className={`${BUTTON} ${ZOOM_DIVIDER}`}
        >
          <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M10 4.5v11M4.5 10h11" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          aria-label="Zoom out"
          className={BUTTON}
        >
          <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
            <path d="M4.5 10h11" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        onClick={onLocate}
        aria-label="Show my location"
        className={`${BUTTON} ${FLOATING}`}
      >
        <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
          <circle cx="10" cy="10" r="3.25" />
          <path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
