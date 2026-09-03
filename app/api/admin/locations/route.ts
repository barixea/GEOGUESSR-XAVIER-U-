import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { CAMPUS_COORDINATE_LIMITS, LOCATION_CACHE_TAG, LOCATION_CATEGORIES, getAllLocations, slugifyLocationName } from '@/lib/locations';
import { requireAdmin } from '@/lib/auth';
import { getSql } from '@/lib/db';
import type { BuildingCategory } from '@/lib/types';

export const runtime = 'nodejs';

function cleanAliases(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, 8);
  }
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 8);
  return [];
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : '';
  const category = body.category as BuildingCategory;
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '';
  const aliases = cleanAliases(body.aliases);
  const longitude = typeof body.longitude === 'number' ? body.longitude : Number(body.longitude);
  const latitude = typeof body.latitude === 'number' ? body.latitude : Number(body.latitude);

  if (name.length < 2) return NextResponse.json({ error: 'Enter a location name.' }, { status: 400 });
  if (!LOCATION_CATEGORIES.includes(category)) return NextResponse.json({ error: 'Choose a valid category.' }, { status: 400 });
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return NextResponse.json({ error: 'Enter valid latitude and longitude values.' }, { status: 400 });
  }

  const { minLongitude, maxLongitude, minLatitude, maxLatitude } = CAMPUS_COORDINATE_LIMITS;
  if (longitude < minLongitude || longitude > maxLongitude || latitude < minLatitude || latitude > maxLatitude) {
    return NextResponse.json({ error: 'The coordinates must be inside the Xavier University campus map area.' }, { status: 400 });
  }

  const existingLocations = await getAllLocations();
  const existingIds = new Set(existingLocations.map((location) => location.id));
  const baseId = slugifyLocationName(name);
  let id = baseId;
  let suffix = 2;
  while (existingIds.has(id)) id = `${baseId}-${suffix++}`;

  const sql = getSql();
  await sql`
    insert into campus_locations (id, name, aliases, category, longitude, latitude, description, created_by, updated_at)
    values (${id}, ${name}, ${aliases}, ${category}, ${longitude}, ${latitude}, ${description || null}, ${String(session.sub ?? 'admin')}, now())
  `;

  revalidateTag(LOCATION_CACHE_TAG);
  return NextResponse.json({
    location: { id, name, aliases, category, coordinates: [longitude, latitude], rooms: [], description },
  });
}
