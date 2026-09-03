'use client';

import { useMemo, useState } from 'react';
import type { BuildingWithPhoto } from '@/lib/types';

type Result = {
  building: BuildingWithPhoto;
  // Set when user typed a room name, not the building name
  matchedRoom: string | null;
};

const SEARCH_INPUT = [
  'w-full rounded-lg bg-white px-3 py-2',
  'text-sm text-slate-800 placeholder:text-slate-400',
  'shadow-sm ring-1 ring-black/10',
  'focus:outline-none focus:ring-2 focus:ring-white/70',
].join(' ');

const RESULTS_PANEL = [
  'absolute inset-x-0 top-full z-30 mt-1',
  'overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5',
].join(' ');


const RESULT_ROW = [
  'block w-full px-3 py-2 text-left text-sm',
  'hover:bg-slate-50 focus:bg-slate-50 focus:outline-none',
].join(' ');

const RESULT_TITLE = 'font-medium text-slate-800';


export default function BuildingSearch({
  buildings,
  onSelect,
}: {
  buildings: BuildingWithPhoto[];
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const hits: Result[] = [];
    for (const building of buildings) {
      const nameHit = [building.name, ...(building.aliases ?? [])].some((s) =>
        s.toLowerCase().includes(q),
      );
      
      const roomHits = building.rooms.filter((r) => r.toLowerCase().includes(q));
      const matchedRoom =
        roomHits.find((r) => r.toLowerCase().startsWith(q)) ?? roomHits[0] ?? null;

      if (nameHit) hits.push({ building, matchedRoom: null });
      else if (matchedRoom) hits.push({ building, matchedRoom });
    }
    return hits.slice(0, 8);
  }, [buildings, query]);

  return (
    <div className="relative w-full">
      <label htmlFor="building-search" className="sr-only">
        Search buildings, rooms, and offices
      </label>
      <input
        id="building-search"
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="building-search-results"
        aria-autocomplete="list"
        value={query}
        placeholder="Type Building"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        // Wait for click to register instead of closing on blur
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        className={SEARCH_INPUT}
      />

      {open && results.length > 0 && (
        <ul id="building-search-results" role="listbox" className={RESULTS_PANEL}>
          {results.map(({ building, matchedRoom }) => (
            <li key={building.id} role="option" aria-selected={false}>
              <button
                type="button"
              // Prevent losing focus when clicking
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(building.id);
                  setQuery('');
                  setOpen(false);
                }}
                className={RESULT_ROW}
              >
                {matchedRoom ? (
                  <>
                    <span className={RESULT_TITLE}>{matchedRoom}</span>
                    <span className="block text-xs text-slate-500">in {building.name}</span>
                  </>
                ) : (
                  <>
                    <span className={RESULT_TITLE}>{building.name}</span>
                    {building.aliases?.length ? (
                      <span className="ml-2 text-xs text-slate-500">
                        {building.aliases.join(' · ')}
                      </span>
                    ) : null}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
