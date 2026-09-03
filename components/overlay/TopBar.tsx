'use client';

import type { ReactNode } from 'react';

import ThemePicker from './ThemePicker';
import { useTheme } from '@/components/theme/ThemeProvider';

// Top navigation bar with title, search, theme picker
const BAR = 'relative z-20 flex h-12 shrink-0 items-center gap-3 bg-brand px-3 shadow-sm sm:h-14 sm:px-4';

// Optional themed background pattern, below content
const ACCENT_LAYER = 'pointer-events-none absolute inset-0 bg-repeat-x';

// XU wordmark (always visible)
const WORDMARK = 'relative truncate text-[13px] font-semibold tracking-wide text-brand-fg sm:text-base';

// Search positioning: full width on mobile, centered on desktop
const SEARCH_SLOT = [
  'relative ml-auto w-full max-w-xs',
  'sm:absolute sm:left-1/2 sm:ml-0 sm:w-80 sm:-translate-x-1/2 md:w-96',
].join(' ');

// Styled top bar with wordmark, search, and theme picker
export default function TopBar({ search }: { search?: ReactNode }) {
  const { theme } = useTheme();
  const accent = theme.accent;

  return (
    <header className={BAR}>
      {/* Optional theme decoration over the brand background */}
      {accent?.image && (
        <div
          aria-hidden="true"
          className={`${ACCENT_LAYER} ${accent.className ?? ''}`}
          style={{ backgroundImage: `url(${accent.image})` }}
        />
      )}

      <h1 className={WORDMARK}>
        Xavier University
        <span className="hidden sm:inline"> - Ateneo de Cagayan</span>
      </h1>

      {search ? <div className={SEARCH_SLOT}>{search}</div> : null}

      {/*
        On mobile the search's own `ml-auto` right-aligns the pair, so the
        picker needs no margin. From `sm` the search leaves the flow entirely,
        so the picker takes over pushing itself to the right edge.
      */}
      <div className="relative sm:ml-auto">
        <ThemePicker />
      </div>
    </header>
  );
}
