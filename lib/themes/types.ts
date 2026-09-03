// Theme shape: CSS colors for Tailwind + raw colors for Mapbox.
// To add: copy an existing theme file, change values, register in index.ts.

// Mapbox Standard's built-in lighting presets
export type LightPreset = 'dawn' | 'day' | 'dusk' | 'night';

export interface Theme {
  id: string; // Saved to localStorage
  label: string; // Shown in the theme picker
  tagline: string; // Description under the label
  swatch: [string, string]; // Two colors shown in the picker chip

  colors: {
    brand: string; // Primary color
    brandDark: string; // Hover/active state
    brandLight: string; // Light fill variant
    onBrand: string; // Contrast text on brand backgrounds
  };

  map: {
    boundaryFill: string; // Campus interior tint
    boundaryLine: string; // Campus perimeter stroke
    boundaryCasing: string; // Outline for readability
    lightPreset2D: LightPreset;
    lightPreset3D: LightPreset;
  };

  /**
   * Optional decoration layered over the top bar — a web pattern, bunting, a
   * team crest. Rendered non-interactively above the bar's background and
   * below its text.
   */
  accent?: {
    /** Path under `public/`, e.g. `/themes/intramurals/bunting.svg`. */
    image?: string;
    /** Extra classes on the overlay, e.g. opacity or background-size. */
    className?: string;
  };
}
