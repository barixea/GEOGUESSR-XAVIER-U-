'use client';

import 'mapbox-gl/dist/mapbox-gl.css';

import { useCallback, useEffect, useRef, useState } from 'react';
import Map, {
  GeolocateControl,
  ScaleControl,
  type GeolocateControlInstance,
  type MapRef,
  type ViewStateChangeEvent,
} from 'react-map-gl/mapbox';

import BuildingMarker from './BuildingMarker';
import BuildingSearch from './BuildingSearch';
import BuildingSheet from './BuildingSheet';
import CampusBoundary from './CampusBoundary';
import ControlDock from '../overlay/ControlDock';
import TopBar from '../overlay/TopBar';
import WelcomeDialog from '../overlay/WelcomeDialog';
import { useTheme } from '@/components/theme/ThemeProvider';
import {
  BASEMAP_CONFIG,
  CAMPUS_BOUNDS,
  CAMPUS_CENTER,
  LABEL_ZOOM_THRESHOLD,
  MAP_STYLE,
  MAX_ZOOM,
  MIN_ZOOM,
  VIEW_2D,
  VIEW_3D,
} from '@/lib/map-config';
import type { BuildingWithPhoto } from '@/lib/types';

type ViewMode = '2d' | '3d';

/**
 * Use `100dvh` instead of `100vh` — on mobile, `vh` doesn't account for
 * browser UI, but `dvh` gives us the actual viewport height.
 */
const SHELL = 'flex h-[100dvh] w-full flex-col overflow-hidden';

const MISSING_TOKEN_SCREEN = 'grid h-[100dvh] w-full place-items-center bg-slate-100 p-6 text-center';

const CODE = 'rounded bg-slate-200 px-1';

export default function CampusMap({ buildings }: { buildings: BuildingWithPhoto[] }) {
  const mapRef = useRef<MapRef>(null);
  const geolocateRef = useRef<GeolocateControlInstance>(null);
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(VIEW_2D.zoom >= LABEL_ZOOM_THRESHOLD);
  const [zoom, setZoom] = useState<number>(VIEW_2D.zoom);
  const [styleReady, setStyleReady] = useState(false);

  const selected = buildings.find((b) => b.id === selectedId) ?? null;
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !styleReady) return;

    const is3D = viewMode === '3d';
    const preset = is3D ? VIEW_3D : VIEW_2D;

    map.easeTo({
      pitch: preset.pitch,
      bearing: preset.bearing,
      zoom: Math.max(map.getZoom(), preset.zoom),
      duration: 700,
      essential: true,
    });

    if (is3D) {
      map.dragRotate.enable();
      map.touchZoomRotate.enableRotation();
    } else {
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
    }
  }, [viewMode, styleReady]);

  // Update map colors when theme changes (separate from camera movements)
  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map || !styleReady) return;

    const is3D = viewMode === '3d';

    // Set basemap properties one by one so a single bad property doesn't break everything
    // (Mapbox might retire or add properties we need to handle gracefully)
    const setConfig = (key: string, value: unknown) => {
      try {
        map.setConfigProperty('basemap', key, value);
      } catch {
        // Property absent from this style — skip it and keep going.
      }
    };

    for (const [key, value] of Object.entries(BASEMAP_CONFIG)) setConfig(key, value);
    setConfig('show3dObjects', is3D);
    setConfig('lightPreset', is3D ? theme.map.lightPreset3D : theme.map.lightPreset2D);
  }, [viewMode, styleReady, theme]);

  // Update label visibility and zoom level as the map zooms
  const handleZoom = useCallback((e: ViewStateChangeEvent) => {
    const next = e.viewState.zoom;
    const labelled = next >= LABEL_ZOOM_THRESHOLD;
    setShowLabels((prev) => (prev === labelled ? prev : labelled));
    setZoom((prev) => (prev === next ? prev : next));
  }, []);

  const focusBuilding = useCallback(
    (id: string) => {
      const building = buildings.find((b) => b.id === id);
      if (!building) return;
      setSelectedId(id);

      const map = mapRef.current?.getMap();
      map?.easeTo({
        center: building.coordinates,
        zoom: Math.max(map.getZoom(), 17.6),
        duration: 600,
        essential: true,
      });
    },
    [buildings],
  );

  const zoomIn = useCallback(() => mapRef.current?.getMap().zoomIn({ duration: 300 }), []);
  const zoomOut = useCallback(() => mapRef.current?.getMap().zoomOut({ duration: 300 }), []);
  // Trigger the GeolocateControl to show user location
  const locate = useCallback(() => geolocateRef.current?.trigger(), []);

  if (!token) {
    return (
      <div className={MISSING_TOKEN_SCREEN}>
        <div className="max-w-sm space-y-2">
          <h1 className="text-base font-semibold text-slate-900">Map unavailable</h1>
          <p className="text-sm text-slate-600">
            <code className={CODE}>NEXT_PUBLIC_MAPBOX_TOKEN</code> is not set. Add it to{' '}
            <code className={CODE}>.env.local</code> and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={SHELL}>
      <TopBar search={<BuildingSearch buildings={buildings} onSelect={focusBuilding} />} />

      <div className="relative flex-1">
        <Map
          ref={mapRef}
          mapboxAccessToken={token}
          mapStyle={MAP_STYLE}
          initialViewState={{ ...CAMPUS_CENTER, ...VIEW_2D }}
          // --- campus lock ---
          maxBounds={CAMPUS_BOUNDS}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          // --- 2D defaults; toggled in the effect above ---
          dragRotate={false}
          pitchWithRotate={false}
          touchPitch={false}
          attributionControl
          reuseMaps
          onLoad={() => setStyleReady(true)}
          onZoom={handleZoom}
          onClick={() => setSelectedId(null)}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Hidden: triggered by the locate button in ControlDock */}
          <GeolocateControl
            ref={geolocateRef}
            position="bottom-right"
            style={{ display: 'none' }}
            trackUserLocation
            positionOptions={{ enableHighAccuracy: true }}
            fitBoundsOptions={{ maxZoom: 18 }}
          />
          <ScaleControl position="bottom-left" unit="metric" maxWidth={90} />

          <CampusBoundary />

          {buildings.map((building) => (
            <BuildingMarker
              key={building.id}
              building={building}
              showLabel={showLabels}
              isSelected={building.id === selectedId}
              onSelect={focusBuilding}
            />
          ))}
        </Map>

        <ControlDock
          mode={viewMode}
          onModeChange={setViewMode}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onLocate={locate}
          canZoomIn={zoom < MAX_ZOOM}
          canZoomOut={zoom > MIN_ZOOM}
        />

        <BuildingSheet building={selected} onClose={() => setSelectedId(null)} />
      </div>

      <WelcomeDialog />
    </div>
  );
}
