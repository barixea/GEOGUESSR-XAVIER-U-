import { unstable_cache } from 'next/cache';

import { BUILDINGS } from '@/data/buildings';
import type { Building, BuildingCategory } from './types';
import { getSql, hasDatabase } from './db';

export { CAMPUS_COORDINATE_LIMITS, LOCATION_CATEGORIES } from './location-config';

export const LOCATION_CACHE_TAG = 'campus-locations';

type CustomLocationRow = {
  id: string;
  name: string;
  aliases: string[] | null;
  category: BuildingCategory;
  longitude: number;
  latitude: number;
  description: string | null;
};

const loadCustomLocations = unstable_cache(
  async (): Promise<Building[]> => {
    if (!hasDatabase) return [];

    const rows = await getSql()<CustomLocationRow[]>`
      select id, name, aliases, category, longitude, latitude, description
      from campus_locations
      order by name asc
    `;

    return rows.map((location) => ({
      id: location.id,
      name: location.name,
      aliases: location.aliases ?? [],
      category: location.category,
      coordinates: [location.longitude, location.latitude],
      rooms: [],
      description: location.description ?? '',
    }));
  },
  ['campus-locations'],
  { tags: [LOCATION_CACHE_TAG], revalidate: 3600 },
);

export async function getAllLocations(): Promise<Building[]> {
  let customLocations: Building[] = [];
  try {
    customLocations = await loadCustomLocations();
  } catch (error) {
    // The static building list keeps the map playable while the database is unavailable.
    console.error('[locations] falling back to static locations:', error);
  }

  return [...BUILDINGS, ...customLocations];
}

export function slugifyLocationName(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `custom-${slug || 'location'}`;
}
