import type { BuildingCategory } from './types';

export const LOCATION_CATEGORIES: BuildingCategory[] = [
  'academic',
  'admin',
  'student-life',
  'chapel',
  'sports',
  'service',
  'landmark',
];

export const CAMPUS_COORDINATE_LIMITS = {
  minLongitude: 124.6437,
  maxLongitude: 124.6503,
  minLatitude: 8.4738,
  maxLatitude: 8.4795,
} as const;
