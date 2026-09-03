import MapShell from '@/components/map/MapShell';
import { getBuildingsWithPhotos } from '@/lib/photos';

export default async function MapPage() {
  const buildings = await getBuildingsWithPhotos();
  return (
    <main>
      <h1 className="sr-only">Xavier University Main Campus Map</h1>
      <MapShell buildings={buildings} />
    </main>
  );
}
