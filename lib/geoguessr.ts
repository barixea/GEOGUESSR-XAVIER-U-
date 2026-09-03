import type { BuildingWithPhoto } from './types';

export const DEFAULT_ROUNDS = 5;
export const MAX_ROUND_SCORE = 5000;
export const SCORE_DECAY_DISTANCE_METERS = 180;
export const INITIAL_HEARTS = 3;
export const ROUND_TIME_SECONDS = 10;

export type GameMode = 'easy' | 'medium' | 'hard';

export const MODE_TOLERANCE_METERS: Record<GameMode, number> = {
  easy: 200,
  medium: 100,
  hard: 25,
};

export const MODE_LABELS: Record<GameMode, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export type Coordinates = [longitude: number, latitude: number];

/** Great-circle distance between two longitude/latitude pairs. */
export function distanceInMeters(a: Coordinates, b: Coordinates): number {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(b[1] - a[1]);
  const longitudeDelta = toRadians(b[0] - a[0]);
  const latitudeA = toRadians(a[1]);
  const latitudeB = toRadians(b[1]);

  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

/** Exponential decay keeps campus-scale guesses meaningful without negative scores. */
export function scoreForDistance(
  distance: number,
  maxScore = MAX_ROUND_SCORE,
  decayDistance = SCORE_DECAY_DISTANCE_METERS,
): number {
  if (!Number.isFinite(distance) || distance < 0) return 0;
  return Math.max(0, Math.min(maxScore, Math.round(maxScore * Math.exp(-distance / decayDistance))));
}

export function isGuessAccepted(distance: number, mode: GameMode): boolean {
  return Number.isFinite(distance) && distance <= MODE_TOLERANCE_METERS[mode];
}

/** Shuffle a copy so the source location list remains stable between games. */
export function shuffleLocations(
  locations: BuildingWithPhoto[],
  random: () => number = Math.random,
): BuildingWithPhoto[] {
  const shuffled = [...locations];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function formatDistance(distance: number): string {
  if (distance < 1000) return `${Math.round(distance)} m`;
  return `${(distance / 1000).toFixed(2)} km`;
}
