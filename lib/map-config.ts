import type { LngLatBoundsLike } from 'mapbox-gl';

export const CAMPUS_CENTER = { longitude: 124.6469, latitude: 8.4766 };

// Campus boundary box; leave ~80m slack so edge buildings fit on mobile
export const CAMPUS_BOUNDS: LngLatBoundsLike = [
  [124.6437, 8.4738],
  [124.6503, 8.4795],
];

export const MIN_ZOOM = 16.2;
export const MAX_ZOOM = 19.5;

export const VIEW_2D = { pitch: 0, bearing: 0, zoom: 16.9 } as const;
export const VIEW_3D = { pitch: 55, bearing: -22, zoom: 17.5 } as const;

export const MAP_STYLE = 'mapbox://styles/mapbox/standard';

// Basemap labels: turn off POI names (we use markers), keep roads/places for orientation
export const BASEMAP_CONFIG = {
  showPointOfInterestLabels: false,
  showLandmarkIconLabels: false,
  showRoadLabels: true,
  showPlaceLabels: true,
  showTransitLabels: false,
} as const;

// Below this zoom level, hide marker labels to prevent overlap
export const LABEL_ZOOM_THRESHOLD = 17;
