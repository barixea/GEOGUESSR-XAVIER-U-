import { del } from '@vercel/blob';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSql } from '@/lib/db';
import { getAllLocations } from '@/lib/locations';
import { PHOTOS_CACHE_TAG } from '@/lib/photos';

export const runtime = 'nodejs';

const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com';

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { buildingId, url, pathname, caption } = (await request
    .json()
    .catch(() => ({}))) as Record<string, unknown>;

  const locations = await getAllLocations();
  if (typeof buildingId !== 'string' || !locations.some((location) => location.id === buildingId)) {
    return NextResponse.json({ error: 'Unknown building' }, { status: 400 });
  }
  if (typeof url !== 'string' || typeof pathname !== 'string') {
    return NextResponse.json({ error: 'Missing blob metadata' }, { status: 400 });
  }

  // Only accept URLs that actually came from our Blob store.
  let host: string;
  try {
    host = new URL(url).host;
  } catch {
    return NextResponse.json({ error: 'Malformed URL' }, { status: 400 });
  }
  if (new URL(url).protocol !== 'https:' || !host.endsWith(BLOB_HOST_SUFFIX)) {
    return NextResponse.json({ error: 'Untrusted URL' }, { status: 400 });
  }

  const expectedPath = new RegExp(`^buildings/${buildingId}/hero\\.(jpg|jpeg|png|webp|avif)$`);
  if (!expectedPath.test(pathname)) {
    return NextResponse.json({ error: 'Invalid blob pathname' }, { status: 400 });
  }

  const sql = getSql();

  const [previous] = await sql<{ blob_url: string }[]>`
    select blob_url from building_photos where building_id = ${buildingId}
  `;

  await sql`
    insert into building_photos (building_id, blob_url, blob_pathname, caption, uploaded_by, updated_at)
    values (
      ${buildingId}, ${url}, ${pathname},
      ${typeof caption === 'string' && caption.trim() ? caption.trim().slice(0, 200) : null},
      ${String(session.sub ?? 'admin')}, now()
    )
    on conflict (building_id) do update set
      blob_url      = excluded.blob_url,
      blob_pathname = excluded.blob_pathname,
      caption       = excluded.caption,
      uploaded_by   = excluded.uploaded_by,
      updated_at    = now()
  `;

  // Deterministic pathnames mean an overwrite reuses the same URL — only
  // delete when the previous blob was genuinely a different object.
  if (previous?.blob_url && previous.blob_url !== url) {
    await del(previous.blob_url).catch(() => {});
  }

  revalidateTag(PHOTOS_CACHE_TAG);
  return NextResponse.json({ ok: true });
}
