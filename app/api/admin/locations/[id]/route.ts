import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

import { LOCATION_CACHE_TAG, getAllLocations } from '@/lib/locations';
import { requireAdmin } from '@/lib/auth';
import { getSql } from '@/lib/db';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await context.params;
  const locations = await getAllLocations();
  if (!locations.some((location) => location.id === id)) {
    return NextResponse.json({ error: 'Unknown location.' }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'Enabled must be true or false.' }, { status: 400 });
  }

  await getSql()`
    insert into campus_location_settings (location_id, enabled, updated_at)
    values (${id}, ${body.enabled}, now())
    on conflict (location_id) do update set
      enabled = excluded.enabled,
      updated_at = now()
  `;

  revalidateTag(LOCATION_CACHE_TAG);
  return NextResponse.json({ locationId: id, enabled: body.enabled });
}
