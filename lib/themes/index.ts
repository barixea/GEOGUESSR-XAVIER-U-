import type { Theme } from './types';
import { red } from './red';
import { xuBlue } from './xu-blue';

export type { Theme, LightPreset } from './types';

// To add a theme: copy red.ts, change the values, import here, add to array.
export const THEMES: Theme[] = [xuBlue, red];

// Default for new visitors
export const DEFAULT_THEME_ID = xuBlue.id;

export const THEME_STORAGE_KEY = 'xu-map:theme';

// Returns the theme or falls back to default if ID is not found
export function getTheme(id: string | null | undefined): Theme {
  return THEMES.find((theme) => theme.id === id) ?? xuBlue;
}
