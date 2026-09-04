# Xavier University Campus Geoguessr

An interactive single-player campus guessing game for Xavier University – Ateneo de Cagayan. Identify a location from one still image, place a pin on the 2D campus map, and earn more points for a closer guess. The original building map remains available at `/map`.

## Quick Start

Get the game running locally in minutes:

```bash
npm install
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_MAPBOX_TOKEN — grab one at mapbox.com/account/access-tokens (free tier works)
npm run dev
```


## How the Game Works

- Each game contains five rounds.
- Choose Easy (200 m), Medium (100 m), or Hard (25 m) before starting. (To be change probably gonna be a  80, 40 and 15 meters respectively)
- Each game starts with three hearts shared across all rounds.
- Every attempt has a ten-second countdown. A timeout costs one heart.
- A round shows one building or campus landmark image at a time.
- Click the 2D Xavier University map to place or move your guess marker.
- Submit the guess. Guesses inside the selected mode's radius are accepted; a miss costs one heart and lets you try again while hearts remain.
- When a guess is accepted, the correct location, connecting line, distance, and score are revealed.
- The final screen shows total score, average distance, and each round's result.

Scoring uses an exponential campus-scale decay:

```text
score = round(5000 * exp(-distanceInMeters / 180)) // to be changed based on the and the area of the Univ
```

Scores are clamped between 0 and 5,000 points. The scoring constants live in [lib/geoguessr.ts](lib/geoguessr.ts).

## Adding Game Images

The game includes the building records in [data/buildings.ts](data/buildings.ts) and any custom records created by an admin. Upload a photo for a location through `/admin/photos`; the game automatically uses that stored photo for the matching location. Until a photo is uploaded, the game displays the local placeholder at `public/images/placeholder-building.svg` so the round remains playable.

Each location's `coordinates` value is the answer location and uses Mapbox's `[longitude, latitude]` order. Keep each location ID stable after uploading a photo.

## Adding Custom Locations

Admins can create non-building game locations directly from `/admin/photos`. Enter a name, category, latitude, longitude, and optional aliases or description. The coordinates must fall inside the campus map area and use normal latitude/longitude values. After creating the record, select it in the photo uploader and publish its image. Custom locations are stored in the `campus_locations` table and are included automatically in the map and game.

If you created the database before custom locations were added, run the updated [db/schema.sql](db/schema.sql) once in Neon. The `create table if not exists` statements are safe to run against the existing database.

## Tech Stack

### Frontend & UI
- **[Next.js 15](https://nextjs.org)** — React framework with built-in routing and edge runtime
- **[React 19](https://react.dev)** — UI components with hooks
- **[TypeScript](https://www.typescriptlang.org)** — Type-safe development end-to-end
- **[Tailwind CSS](https://tailwindcss.com)** — Utility-first styling with custom theme system

### Mapping
- **[Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)** — Interactive 2D campus map
- **[react-map-gl](https://visgl.github.io/react-map-gl/)** — React bindings for Mapbox

### Development Tools
- **Node.js** — JavaScript runtime
- **Git** — Version control

## DEPLOYED AT  VERCEL 
- BLOB Storage
- Neon Postgre Database

Then access the admin panel at `/admin/login` to upload photos!

## Updating Building Data

Accurate coordinates are important for a good map experience. The placeholder coordinates in [data/buildings.ts](data/buildings.ts) are starting estimates — use [geojson.io](https://geojson.io) over satellite imagery to capture real building centroids.

**Important:** Building IDs are permanent keys used for photo storage. Changing an ID after photos are uploaded will orphan them. To safely rename:

1. Update the file path in Blob storage with the new ID
2. Update the `building_id` in your database
3. Update `data/buildings.ts`

Or just delete the old photo and re-upload under the new ID.

## Features

- **Campus Geoguessr** — Five-round single-player image guessing game
- **2D Campus Map** — Click-to-place guess marker with answer reveal and distance scoring
- **Building Search** — Find buildings by name or rooms inside them
- **Geolocation** — Show your current location on the map
- **Photo Gallery** — Admin panel to upload and manage building photos
- **Secure Auth** — Password-protected admin area (Middleware)

## Features to Add
- Custom events
- Multiplayer
## 📄 License

MIT
