import { unstable_cache } from 'next/cache';
import { getSql, hasDatabase } from './db';
import { getAllLocations } from './locations';
import type { BuildingPhoto, BuildingWithPhoto } from './types';

export const PHOTOS_CACHE_TAG = 'building-photos';

const loadPhotos = unstable_cache(
  async (): Promise<BuildingPhoto[]> => {
    if (!hasDatabase) return [];

    const rows = await getSql()<
      { building_id: string; blob_url: string; caption: string | null; updated_at: Date }[]
    >`select building_id, blob_url, caption, updated_at from building_photos`;

    return rows.map((r) => ({
      buildingId: r.building_id,
      url: r.blob_url,
      caption: r.caption,
      updatedAt: r.updated_at.toISOString(),
    }));
  },
  ['building-photos'],
  { tags: [PHOTOS_CACHE_TAG], revalidate: 3600 },
);

export async function getBuildingsWithPhotos(): Promise<BuildingWithPhoto[]> {
  let photos: BuildingPhoto[] = [];
  try {
    photos = await loadPhotos();
  } catch (error) {
    // DB errors don't break the map — buildings show without photos
    console.error('[photos] falling back to no photos:', error);
  }

  const byId = new Map(photos.map((p) => [p.buildingId, p]));
  const locations = await getAllLocations();
  return locations.map((location) => ({ ...location, photo: byId.get(location.id) ?? null }));
}
