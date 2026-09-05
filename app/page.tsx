import GeoguessrGame from '@/components/game/GeoguessrGame';
import { getBuildingsWithPhotos } from '@/lib/photos';
import { isLocationEnabled } from '@/lib/locations';

export default async function HomePage() {
  const locations = (await getBuildingsWithPhotos()).filter(isLocationEnabled);
  return (
    <main>
      <GeoguessrGame locations={locations} />
    </main>
  );
}
