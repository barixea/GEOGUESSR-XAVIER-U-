'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * First-visit popup.
 *
 * ─────────────────────────────────────────────────────────────────────────
 *  EDIT ME — everything inside <DialogBody /> below is placeholder copy.
 *  Replace it with whatever the welcome message should say. The dialog
 *  mechanics (first-visit gating, Escape to close, focus handling) live
 *  outside it, so you can rewrite the body freely without touching them.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Shown once per browser: dismissing it writes STORAGE_KEY to localStorage.
 * Bump the version suffix to show it again to everyone after an edit, or set
 * SHOW_EVERY_VISIT to true while you are working on the copy.
 */
const STORAGE_KEY = 'xu-map:welcome-seen:v1';
const SHOW_EVERY_VISIT = false;

/** Dimmed full-screen layer. Clicking it anywhere dismisses the dialog. */
const BACKDROP = 'fixed inset-0 z-50 grid place-items-center bg-black/50 p-4';

/** `w-full` with a `max-w-md` ceiling: full width on a phone, capped on desktop. */
const CARD = 'w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl';

/** Themed confirm button — `bg-brand` follows whichever theme is active. */
const DISMISS_BUTTON = [
  'mt-5 w-full rounded-lg bg-brand px-4 py-2.5',
  'text-sm font-semibold text-white',
  'transition hover:bg-brand-dark',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
].join(' ');

function DialogBody() {
  return (
    <>
      <h2 id="welcome-title" className="text-lg font-semibold text-slate-900">
        Welcome to the XU Campus Map
      </h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-slate-600">
        <p>Hello, dev here this is the Version 1.0! And note this is not affiliated with the university.</p>
        <p>
          Search for a building, room, or office in the bar at the top, or tap any point on the map
          to see what is inside it.
        </p>
      </div>
    </>
  );
}

export default function WelcomeDialog() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Read localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    if (SHOW_EVERY_VISIT) {
      setOpen(true);
      return;
    }
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      // Private mode or storage disabled — show it anyway
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function dismiss() {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Nothing to do — the dialog just reappears next visit.
    }
  }

  if (!open) return null;

  return (
    <div className={BACKDROP} onClick={dismiss} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        // Without this, a click inside the card would bubble to the backdrop
        // above and close the dialog you were trying to read.
        onClick={(e) => e.stopPropagation()}
        className={CARD}
      >
        <DialogBody />

        <button ref={closeRef} type="button" onClick={dismiss} className={DISMISS_BUTTON}>
          Get started
        </button>
      </div>
    </div>
  );
}
