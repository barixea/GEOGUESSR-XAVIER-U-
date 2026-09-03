import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import PhotoUploadForm from '@/components/admin/PhotoUploadForm';
import LocationCreateForm from '@/components/admin/LocationCreateForm';
import { requireAdmin } from '@/lib/auth';
import { getAllLocations } from '@/lib/locations';
import { getBuildingsWithPhotos } from '@/lib/photos';

/** Readable column, centred, with even spacing between the three sections. */
const PAGE = 'mx-auto max-w-4xl space-y-8 p-6';

/** One building in the review grid. `overflow-hidden` crops the photo corners. */
const PHOTO_CARD = 'overflow-hidden rounded-lg border border-slate-200';

/** `relative` is required for the next/image `fill` inside it. */
const PHOTO_FRAME = 'relative aspect-[16/9] bg-slate-100';

const BACK_LINK = 'inline-flex items-center text-sm text-slate-600 hover:text-slate-900';

export default async function AdminPhotosPage() {
  // Server-side gate: the middleware guards the route, and this re-checks the
  // session before any data is read, so the page can never render half-open.
  const session = await requireAdmin();
  if (!session) redirect('/admin/login');

  const locations = await getAllLocations();
  const buildingsWithPhotos = await getBuildingsWithPhotos();

  return (
    <div className={PAGE}>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Locations and photos</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage the places that can appear in the campus guessing game.
        </p>
      </div>

      <LocationCreateForm />

      <div className="border-t border-slate-200 pt-8">
        <h2 className="text-lg font-semibold text-slate-900">Upload a location photo</h2>
        <p className="mt-1 text-sm text-slate-600">Choose any existing building or custom location.</p>
        <div className="mt-4"><PhotoUploadForm buildings={locations} /></div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Current locations</h2>
        {/* Every building is listed, with or without a photo, so the gaps show. */}
        <ul className="grid gap-4 sm:grid-cols-2">
          {buildingsWithPhotos.map((building) => (
            <li key={building.id} className={PHOTO_CARD}>
              <div className={PHOTO_FRAME}>
                <Image
                  src={building.photo?.url ?? '/images/placeholder-building.svg'}
                  alt={building.photo?.caption ?? `${building.name} — no photo yet`}
                  fill
                  sizes="(max-width: 640px) 100vw, 384px"
                  className="object-cover"
                />
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-slate-900">{building.name}</p>
                  {building.id.startsWith('custom-') && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Custom</span>}
                </div>
                {building.photo ? (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {building.photo.caption || 'No caption'}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-slate-400">No photo uploaded yet</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <Link href="/" className={BACK_LINK}>
          ← Back to map
        </Link>
      </div>
    </div>
  );
}
