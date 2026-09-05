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

type LocationSettingRow = {
  location_id: string;
  enabled: boolean;
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

const loadLocationSettings = unstable_cache(
  async (): Promise<Record<string, boolean>> => {
    if (!hasDatabase) return {};

    const rows = await getSql()<LocationSettingRow[]>`
      select location_id, enabled
      from campus_location_settings
    `;

    return Object.fromEntries(rows.map((row) => [row.location_id, row.enabled]));
  },
  ['campus-location-settings'],
  { tags: [LOCATION_CACHE_TAG], revalidate: 3600 },
);

export async function getAllLocations(): Promise<Building[]> {
  let customLocations: Building[] = [];
  let locationSettings: Record<string, boolean> = {};

  try {
    customLocations = await loadCustomLocations();
  } catch (error) {
    // The static building list keeps the map playable while the database is unavailable.
    console.error('[locations] falling back to static locations:', error);
  }

  try {
    locationSettings = await loadLocationSettings();
  } catch (error) {
    // The settings table may not exist until the latest schema is run; default to enabled.
    console.error('[locations] falling back to enabled locations:', error);
  }

  const staticLocations = BUILDINGS.map((location) => ({
    ...location,
    enabled: locationSettings[location.id] ?? true,
  }));
  const databaseLocations = customLocations.map((location) => ({
    ...location,
    enabled: locationSettings[location.id] ?? true,
  }));

  return [...staticLocations, ...databaseLocations];
}

export function isLocationEnabled(location: Pick<Building, 'enabled'>): boolean {
  return location.enabled !== false;
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
