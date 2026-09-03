import GeoguessrGame from '@/components/game/GeoguessrGame';
import { getBuildingsWithPhotos } from '@/lib/photos';

export default async function HomePage() {
  const locations = await getBuildingsWithPhotos();
  return (
    <main>
      <GeoguessrGame locations={locations} />
    </main>
  );
}
