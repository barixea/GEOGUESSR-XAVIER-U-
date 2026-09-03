'use client';

import { useEffect, useRef, useState } from 'react';

import { useTheme } from '@/components/theme/ThemeProvider';
import { THEMES } from '@/lib/themes';

// Styled button to open the theme menu
const TRIGGER = [
  'grid size-9 place-items-center rounded-lg text-brand-fg',
  'transition hover:bg-white/15',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
].join(' ');

// Dropdown menu positioning
const MENU = [
  'absolute right-0 top-full z-40 mt-2 w-60',
  'overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-black/10',
].join(' ');

// One menu row per theme
const MENU_ITEM = [
  'flex w-full items-center gap-3 px-3 py-2.5 text-left',
  'transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
].join(' ');

// Two-color preview chip for each theme
const SWATCH = 'flex size-7 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10';

// Theme menu — shows all available themes
export default function ThemePicker() {
  const { themeId, setThemeId } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click or Escape
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Change theme"
        className={TRIGGER}
      >
        {/* Painter's palette */}
        <svg
          viewBox="0 0 20 20"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden="true"
        >
          <path d="M10 2.25c-4.28 0-7.75 3.24-7.75 7.24 0 4 3.47 6.26 7.75 6.26.9 0 1.5.6 1.5 1.5s.6 1.5 1.5 1.5c2.62 0 4.75-2.9 4.75-6.5 0-5.52-3.47-10-7.75-10Z" />
          <circle cx="6.6" cy="9.4" r="1.05" fill="currentColor" stroke="none" />
          <circle cx="9.7" cy="6.4" r="1.05" fill="currentColor" stroke="none" />
          <circle cx="13.2" cy="8.6" r="1.05" fill="currentColor" stroke="none" />
        </svg>
      </button>

      {open && (
        <div role="menu" aria-label="Theme" className={MENU}>
          {THEMES.map((theme) => {
            const active = theme.id === themeId;
            return (
              <button
                key={theme.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setThemeId(theme.id);
                  setOpen(false);
                }}
                className={MENU_ITEM}
              >
                {/* Two-tone chip: brand color over the map accent. */}
                <span aria-hidden="true" className={SWATCH}>
                  <span className="w-1/2" style={{ backgroundColor: theme.swatch[0] }} />
                  <span className="w-1/2" style={{ backgroundColor: theme.swatch[1] }} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {theme.label}
                  </span>
                  <span className="block truncate text-xs text-slate-500">{theme.tagline}</span>
                </span>

                {active && (
                  <svg
                    viewBox="0 0 20 20"
                    className="size-4 shrink-0 text-brand"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m4.5 10.5 3.5 3.5 7.5-8" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
