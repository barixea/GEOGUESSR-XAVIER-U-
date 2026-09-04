import { DEFAULT_THEME_ID, THEMES } from './index';
import type { Theme } from './types';


// Convert hex to RGB channels for Tailwind alpha value syntax.
// '#293871' → '41 56 113' so bg-brand/50 works as rgb(41 56 113 / 0.5)
function toChannels(hex: string): string {
  const raw = hex.trim().replace(/^#/, '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    // Fail loudly at build time instead of shipping broken colors
    throw new Error(`Invalid theme color "${hex}" — expected #rgb or #rrggbb.`);
  }

  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

function variables(theme: Theme): string {
  const { brand, brandDark, brandLight, onBrand } = theme.colors;
  return [
    `--brand:${toChannels(brand)}`,
    `--brand-dark:${toChannels(brandDark)}`,
    `--brand-light:${toChannels(brandLight)}`,
    `--on-brand:${toChannels(onBrand)}`,
  ].join(';');
}

function assertSafeId(id: string): string {
  if (!/^[a-z0-9-]+$/.test(id)) {
    throw new Error(`Invalid theme id "${id}" — use lowercase letters, digits, and dashes.`);
  }
  return id;
}

export function themeStyleSheet(): string {
  const blocks = THEMES.map((theme) => {
    const vars = variables(theme);
    const selector = `[data-theme="${assertSafeId(theme.id)}"]`;
    return theme.id === DEFAULT_THEME_ID
      ? `:root,${selector}{${vars}}`
      : `${selector}{${vars}}`;
  });

  return blocks.join('');
}
