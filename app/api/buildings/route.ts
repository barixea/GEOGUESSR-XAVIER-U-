import { NextResponse } from 'next/server';
import { getBuildingsWithPhotos } from '@/lib/photos';

export const runtime = 'nodejs';

/** Public read endpoint — useful for a future native app or widget. */
export async function GET() {
  const buildings = await getBuildingsWithPhotos();
  return NextResponse.json(
    { buildings },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' } },
  );
}
