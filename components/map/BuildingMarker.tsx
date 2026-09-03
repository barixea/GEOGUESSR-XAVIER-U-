'use client';

import { Marker } from 'react-map-gl/mapbox';
import type { BuildingCategory, BuildingWithPhoto } from '@/lib/types';

// Each category gets its own color for quick visual scanning
const CATEGORY_COLOR: Record<BuildingCategory, string> = {
  academic: 'bg-blue-600',
  admin: 'bg-slate-700',
  'student-life': 'bg-amber-600',
  chapel: 'bg-violet-600',
  sports: 'bg-emerald-600',
  service: 'bg-rose-600',
  landmark: 'bg-teal-600',
};

const FALLBACK_COLOR = 'bg-slate-600';

// Label with dot, stacked for readability
const MARKER = 'group flex cursor-pointer flex-col items-center gap-1 focus:outline-none';


const LABEL = [
  'max-w-[9rem] truncate',
  'rounded-md bg-white/95 px-2 py-0.5',
  'text-xs font-semibold text-slate-800',
  'shadow-sm ring-1 ring-black/5',
].join(' ');

const DOT = [
  'relative size-2.5 rounded-full',
  'ring-[1.5px] ring-white',
  `after:absolute after:-inset-2 after:content-['']`,
  'transition-transform group-hover:scale-125',
  'group-focus-visible:scale-125 group-focus-visible:ring-slate-900',
].join(' ');

/** Held while this building owns the detail sheet. */
const DOT_SELECTED = 'scale-150';

type Props = {
  building: BuildingWithPhoto;
  showLabel: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

export default function BuildingMarker({ building, showLabel, isSelected, onSelect }: Props) {
  const [longitude, latitude] = building.coordinates;
  const dotColor = CATEGORY_COLOR[building.category] ?? FALLBACK_COLOR;

  const spokenLabel = building.rooms.length
    ? `${building.name}. ${building.rooms.length} rooms and offices inside.`
    : building.name;

  return (
    <Marker longitude={longitude} latitude={latitude} anchor="bottom">
      <button
        type="button"
        aria-label={spokenLabel}
        aria-pressed={isSelected}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(building.id);
        }}
        className={MARKER}
      >
        {showLabel && <span className={LABEL}>{building.name}</span>}

        <span className={`${DOT} ${dotColor} ${isSelected ? DOT_SELECTED : ''}`} />
      </button>
    </Marker>
  );
}
