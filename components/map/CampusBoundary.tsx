'use client';

import { useMemo } from 'react';
import { Layer, Source, type LayerProps } from 'react-map-gl/mapbox';

import { useTheme } from '@/components/theme/ThemeProvider';
import { CAMPUS_BOUNDARY } from '@/data/campus-boundary';

// Campus boundary with tinted fill and cased outline using Mapbox layers
export default function CampusBoundary() {
  const { theme } = useTheme();
  const { boundaryFill, boundaryLine, boundaryCasing } = theme.map;

  const fillLayer = useMemo<LayerProps>(
    () => ({
      id: 'campus-fill',
      type: 'fill',
      slot: 'bottom',
      paint: {
        'fill-color': boundaryFill,
        'fill-opacity': ['interpolate', ['linear'], ['zoom'], 16, 0.12, 18.5, 0.04],
      },
    }),
    [boundaryFill],
  );

  // Outline stroke for legibility on dark or busy tiles
  const outlineCasingLayer = useMemo<LayerProps>(
    () => ({
      id: 'campus-outline-casing',
      type: 'line',
      slot: 'middle',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': boundaryCasing,
        'line-opacity': 0.9,
        'line-width': ['interpolate', ['linear'], ['zoom'], 16, 4, 19.5, 9],
      },
    }),
    [boundaryCasing],
  );

  const outlineLayer = useMemo<LayerProps>(
    () => ({
      id: 'campus-outline',
      type: 'line',
      slot: 'middle',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': boundaryLine,
        'line-width': ['interpolate', ['linear'], ['zoom'], 16, 1.75, 19.5, 4],
      },
    }),
    [boundaryLine],
  );

  return (
    <Source id="campus-boundary" type="geojson" data={CAMPUS_BOUNDARY}>
      <Layer {...fillLayer} />
      <Layer {...outlineCasingLayer} />
      <Layer {...outlineLayer} />
    </Source>
  );
}
