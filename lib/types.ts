export type BuildingCategory =
  | 'academic' | 'admin' | 'student-life' | 'chapel' | 'sports' | 'service' | 'landmark';

export interface Building {
  // Stable ID; never change after a photo is uploaded (used as blob key)
  id: string;
  name: string;
  // Student-friendly search terms like "Magis", "SC", or "the caf"
  aliases?: string[];
  category: BuildingCategory;
  // [longitude, latitude] for Mapbox
  coordinates: [number, number];
  // Rooms and offices students might search for — write how they'd type it
  rooms: string[];
  // Shown in the detail sheet; empty string shows nothing
  description: string;
}

export interface BuildingPhoto {
  buildingId: string;
  url: string;
  caption: string | null;
  updatedAt: string;
}

export type BuildingWithPhoto = Building & { photo: BuildingPhoto | null };
