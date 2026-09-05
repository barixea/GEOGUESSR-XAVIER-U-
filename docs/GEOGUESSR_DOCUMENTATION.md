# Xavier University Geoguessr Documentation

This guide explains the files, configuration points, data flow, and operational workflows for the Xavier University Geoguessr project.

## 1. Project Overview

The application is a Next.js 15 and React 19 app with two map experiences:

- `/` is the single-player Xavier University Geoguessr game.
- `/map` is the original searchable campus map.

The game shows one still image at a time. A player places a pin on a 2D Mapbox map, submits a guess, and receives a distance-based score. The game also has difficulty modes, three shared hearts, and a ten-second timer per attempt.

## 2. Repository Map

### App routes

| File | Purpose |
| --- | --- |
| `app/page.tsx` | Server entry point for the Geoguessr homepage. Loads enabled locations with photos and renders `GeoguessrGame`. |
| `app/map/page.tsx` | Preserves the original campus map at `/map`. |
| `app/layout.tsx` | Global metadata, viewport, theme bootstrap, and the shared `ThemeProvider`. |
| `app/globals.css` | Tailwind entry styles plus Geoguessr timer, correct-answer, and wrong-answer animations. |
| `app/admin/login/page.tsx` | Admin password login screen. |
| `app/admin/photos/page.tsx` | Admin dashboard for creating locations, uploading photos, and reviewing location cards. |

### Geoguessr game

| File | Purpose |
| --- | --- |
| `components/game/GeoguessrGame.tsx` | Main client-side game state, image clue, 2D map, timer, hearts, mode selection, scoring display, and final results. |
| `lib/geoguessr.ts` | Game constants and pure helpers: distance, score, difficulty tolerance, acceptance, shuffling, and distance formatting. |

### Admin and API

| File | Purpose |
| --- | --- |
| `components/admin/LocationCreateForm.tsx` | Admin form for creating a custom campus location in Neon. |
| `components/admin/PhotoUploadForm.tsx` | Admin form for uploading or replacing a location image in Vercel Blob and saving its metadata. |
| `app/api/admin/locations/route.ts` | Authenticated `POST` endpoint that validates and inserts custom locations. |
| `app/api/admin/locations/[id]/route.ts` | Authenticated `PATCH` endpoint that enables or disables a location for new games. |
| `app/api/admin/photos/upload/route.ts` | Authenticated Vercel Blob token endpoint. Validates the location ID and image upload constraints. |
| `app/api/admin/photos/route.ts` | Authenticated endpoint that stores Blob metadata in Postgres and replaces old photo metadata safely. |
| `app/api/admin/login/route.ts` | Checks `ADMIN_PASSWORD` and creates the signed admin session cookie. |
| `app/api/admin/logout/route.ts` | Clears the admin session cookie. |
| `middleware.ts` | Protects `/admin/photos` and `/api/admin/photos/*` with the signed session cookie. |

### Location and photo data

| File | Purpose |
| --- | --- |
| `data/buildings.ts` | Static building and landmark locations shipped with the code. Coordinates use `[longitude, latitude]`. |
| `data/campus-boundary.ts` | GeoJSON campus boundary used to draw the campus outline and validate the map area. |
| `lib/locations.ts` | Reads admin-created custom locations from Neon and merges them with `data/buildings.ts`. |
| `lib/location-config.ts` | Browser-safe location categories and campus coordinate limits shared by the admin form. |
| `lib/photos.ts` | Reads photo metadata from Postgres and attaches photos to all static and custom locations. |
| `lib/types.ts` | Shared TypeScript shapes for buildings, photos, and location records. |

### Map, theme, and infrastructure

| File | Purpose |
| --- | --- |
| `lib/map-config.ts` | Campus center, map bounds, zoom limits, Mapbox style, and the fixed flat camera preset. |
| `components/map/CampusMap.tsx` | Original `/map` experience with searchable building markers and map controls. |
| `components/map/MapShell.tsx` | Client-only Mapbox wrapper for the original map. |
| `components/map/BuildingMarker.tsx` | Clickable building dot used by the original map. |
| `components/map/BuildingSearch.tsx` | Building and room search for the original map. |
| `components/map/BuildingSheet.tsx` | Building detail panel with photo, description, and rooms. |
| `components/map/CampusBoundary.tsx` | Themed campus boundary layers for the original map. |
| `components/overlay/ControlDock.tsx` | Zoom and geolocation controls for `/map`. |
| `components/overlay/ViewModeToggle.tsx` | Legacy 2D/3D control used only by the original `/map` experience. It is not used by Geoguessr. |
| `components/overlay/TopBar.tsx` | Shared original-map header and theme picker layout. |
| `components/overlay/ThemePicker.tsx` | Theme selection UI. |
| `components/overlay/WelcomeDialog.tsx` | Original-map welcome dialog. |
| `components/theme/ThemeProvider.tsx` | Client theme state and localStorage persistence. |
| `lib/themes/*` | Theme definitions, CSS variable generation, and theme initialization. |
| `lib/db.ts` | Lazy Postgres connection using `DATABASE_URL`. |
| `lib/auth.ts` and `lib/auth-edge.ts` | Signed admin session creation and verification. |
| `db/schema.sql` | Postgres tables for uploaded photo metadata, custom locations, and per-location game settings. |
| `next.config.ts` | Next image remote-host configuration for Vercel Blob URLs. |
| `package.json` | Scripts and dependency versions. |
| `.env.local.example` | Names and examples for required environment variables. Never put real secrets in Git. |
| `public/images/placeholder-building.svg` | Local fallback image used before a real location photo is uploaded. |

Generated folders such as `.next/` and `node_modules/` are build/dependency output and should not be edited.

## 3. Configuration Locator

### Game rules

All game rules are in `lib/geoguessr.ts`:

| Setting | Constant | Current value |
| --- | --- | --- |
| Rounds per game | `DEFAULT_ROUNDS` | `5` |
| Starting hearts | `INITIAL_HEARTS` | `3` shared across the game |
| Timer | `ROUND_TIME_SECONDS` | `10` seconds per attempt |
| Easy tolerance | `MODE_TOLERANCE_METERS.easy` | `200` meters |
| Medium tolerance | `MODE_TOLERANCE_METERS.medium` | `100` meters |
| Hard tolerance | `MODE_TOLERANCE_METERS.hard` | `25` meters |
| Maximum score | `MAX_ROUND_SCORE` | `5,000` |
| Score decay | `SCORE_DECAY_DISTANCE_METERS` | `180` meters |

The acceptance rule is implemented by `isGuessAccepted(distance, mode)`. A missed guess or timeout costs exactly one heart. When hearts reach zero, the game ends after the current result is shown.

### Map view

`lib/map-config.ts` is the map configuration source:

- `CAMPUS_CENTER`: initial map center.
- `CAMPUS_BOUNDS`: maximum geographic area that can be viewed.
- `MIN_ZOOM` and `MAX_ZOOM`: zoom limits.
- `VIEW_2D`: flat camera settings used by Geoguessr and the original map.
- `MAP_STYLE`: Mapbox style URL.

The Geoguessr map has additional label suppression in `components/game/GeoguessrGame.tsx`. It disables POI, landmark, road, place, transit, and 3D-object visibility so labels do not reveal the answer.

### Static locations

Edit `data/buildings.ts` to ship a new built-in location with the code:

```ts
{
  id: 'unique-location-id',
  name: 'Location name',
  aliases: ['Short name'],
  category: 'landmark',
  coordinates: [124.647123, 8.476456],
  rooms: [],
  description: '',
}
```

Coordinates must be `[longitude, latitude]`. The ID becomes the photo-storage key, so do not change it after publishing a photo.

### Enable or disable locations

Use the **Enabled** switch beside each location on `/admin/photos`. The switch works for built-in buildings and custom locations. Enabled locations are eligible for new Geoguessr rounds; disabled locations remain in the admin dashboard and retain their photos and coordinates. The setting is stored in `campus_location_settings`, so it survives deployments and source-code changes. If no setting row exists, the location defaults to enabled.

### Admin-created locations

Admins create non-building locations from `/admin/photos`. Records are inserted into the `campus_locations` table and read by `lib/locations.ts`. The API validates the name, category, numeric coordinates, and campus bounds before inserting.

The current campus coordinate limits are in `lib/location-config.ts`:

```text
Longitude: 124.6437 to 124.6503
Latitude:  8.4738 to 8.4795
```

### Photos

Photo metadata is stored in the `building_photos` table. The image file itself is stored in Vercel Blob using this deterministic path pattern:

```text
buildings/{location-id}/hero.{extension}
```

Supported formats are JPEG, PNG, WebP, and AVIF. The upload limit is 8 MB. Uploading another image for the same location replaces the previous database record and removes the old Blob object when it is a different URL.

## 4. Database Schema

Run `db/schema.sql` in the Neon SQL Editor. It creates:

### `building_photos`

One row per location photo:

- `building_id`: static or custom location ID.
- `blob_url`: public Vercel Blob image URL.
- `blob_pathname`: deterministic Blob pathname.
- `caption`: optional alt-text caption.
- `uploaded_by`: admin subject from the signed session.
- `updated_at`: last publish time.

### `campus_locations`

One row per admin-created location:

- `id`: generated stable ID beginning with `custom-`.
- `name`: player-facing location name, revealed after a result.
- `aliases`: optional search terms.
- `category`: one of the supported building categories.
- `longitude` and `latitude`: exact answer coordinate.
- `description`: optional detail text.
- `created_by`, `created_at`, and `updated_at`: audit information.

### `campus_location_settings`

One row per location whose default game participation has been overridden:

- `location_id`: static or custom location ID.
- `enabled`: whether the location may be selected for a new game.
- `updated_at`: last toggle time.

This table intentionally has no foreign key because built-in locations live in `data/buildings.ts`, not in `campus_locations`.

The schema uses `create table if not exists`, so it is safe to run again after a project update.

## 5. Environment Variables

Configure these in Vercel Project Settings. Do not commit real values:

| Variable | Used by | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | `components/game/GeoguessrGame.tsx`, `components/map/CampusMap.tsx` | Public Mapbox map access token. |
| `DATABASE_URL` | `lib/db.ts` | Pooled Neon/Postgres connection string. |
| `BLOB_READ_WRITE_TOKEN` | `@vercel/blob` upload functions | Private Vercel Blob read/write credential. |
| `ADMIN_PASSWORD` | `app/api/admin/login/route.ts` | The single admin login password. There is no username account system yet. |
| `ADMIN_SESSION_SECRET` | `lib/auth-edge.ts` | Secret used to sign and verify admin session cookies. |

Vercel may also add provider-specific `DATABASE_*` and `BLOB_*` variables. The application only requires the exact names above.

## 6. User and Admin Flows

### Player flow

1. Open `/`.
2. Select Easy, Medium, or Hard.
3. Start a five-round game with three shared hearts.
4. View the still image and place a map pin.
5. Submit within ten seconds.
6. If the guess is outside the selected radius, lose one heart and receive another ten-second attempt.
7. If the timer reaches zero, lose one heart and receive another attempt while hearts remain.
8. An accepted guess reveals the answer, line, distance, and score.
9. Continue until five rounds are complete or all hearts are gone.

### Admin flow

1. Open `/admin/login`.
2. Sign in using `ADMIN_PASSWORD`.
3. Open `/admin/photos`.
4. Use the Enabled switch to include or exclude any location from new games.
5. Create a custom location with a name, category, and coordinates, or select an existing location.
6. Upload a photo and optional caption.
7. The image goes to Vercel Blob; metadata goes to Postgres.
8. The next page request loads enabled locations and their photos into Geoguessr.

## 7. Deployment Checklist

- Connect the GitHub repository to Vercel.
- Set the five required environment variables.
- Connect Neon/Postgres and Vercel Blob.
- Run the current `db/schema.sql` in Neon, including the `campus_locations` and `campus_location_settings` tables.
- Redeploy after changing environment variables or database integrations.
- Test `/`, `/admin/login`, `/admin/photos`, and `/map`.
- Upload one test photo before adding the full photo set.
- Never put `.env.local` or real secret values in GitHub.

## 8. Common Troubleshooting

### Map unavailable

Check `NEXT_PUBLIC_MAPBOX_TOKEN` in Vercel and redeploy. Environment-variable changes do not affect an already-built deployment until a new deployment runs.

### Admin login says server misconfigured

Check `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`. Both must be present in the Vercel environment used by the deployment.

### Upload fails

Check `BLOB_READ_WRITE_TOKEN`, confirm the Blob store is connected to the project, and confirm the file is an accepted type under 8 MB.

### Locations do not appear

Run the current `db/schema.sql` in Neon and confirm `DATABASE_URL` exists. Check that the location is marked Enabled on `/admin/photos`. The application intentionally falls back to static locations if the database is unavailable.

### New location coordinates are rejected

The admin API only accepts points inside the coordinate limits in `lib/location-config.ts`. Update those limits only if the intended playable campus area expands.

## 9. Useful Commands

```bash
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

To deploy code changes through the connected GitHub repository:

```bash
git add .
git commit -m "Describe the change"
git push origin main
```

Vercel creates a new production deployment from the push to `main`.
