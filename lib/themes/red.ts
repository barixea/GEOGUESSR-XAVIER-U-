import type { Theme } from './types';

// Alternate theme: a bold red look. Tests theme switching.
// Brand color meets WCAG contrast requirements for readability.
export const red: Theme = {
  id: 'red',
  label: 'Red',
  tagline: 'A bold alternate look',
  swatch: ['#b0121f', '#ef4444'],

  colors: {
    brand: '#b0121f',
    brandDark: '#8a0e18',
    brandLight: '#d8283a',
    onBrand: '#ffffff',
  },

  map: {
    // Brighter for visibility on map tiles
    boundaryFill: '#ef4444',
    boundaryLine: '#991b1b',
    boundaryCasing: '#ffffff',
    lightPreset2D: 'dawn',
    lightPreset3D: 'day',
  },
};
