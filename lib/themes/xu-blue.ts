import type { Theme } from './types';

// Default theme: Xavier University navy — the map's original colors.
export const xuBlue: Theme = {
  id: 'xu-blue',
  label: 'XU Blue',
  tagline: 'The university colors',
  swatch: ['#293871', '#2563eb'],

  colors: {
    brand: '#293871',
    brandDark: '#1d2851',
    brandLight: '#3b4d96',
    onBrand: '#ffffff',
  },

  map: {
    boundaryFill: '#2563eb',
    boundaryLine: '#1d4ed8',
    boundaryCasing: '#ffffff',
    lightPreset2D: 'dawn',
    lightPreset3D: 'day',
  },
};
