'use client';

import dynamic from 'next/dynamic';
import type { BuildingWithPhoto } from '@/lib/types';

// Placeholder while Mapbox loads (no SSR since mapbox-gl touches window)
const LOADING_SCREEN = 'grid h-[100dvh] w-full place-items-center bg-slate-100';

// mapbox-gl reads window at import, so skip server-side rendering
const CampusMap = dynamic(() => import('./CampusMap'), {
  ssr: false,
  loading: () => (
    <div className={LOADING_SCREEN}>
      <p className="text-sm text-slate-500">Loading campus map…</p>
    </div>
  ),
});

export default function MapShell({ buildings }: { buildings: BuildingWithPhoto[] }) {
  return <CampusMap buildings={buildings} />;
}
