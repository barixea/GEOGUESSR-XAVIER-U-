import { THEMES, THEME_STORAGE_KEY } from './index';

// Runs in <head> before first paint to apply the user's stored theme.
// Prevents a visual flash when a returning visitor's theme loads.
export function themeInitScript(): string {
  const ids = THEMES.map((theme) => theme.id);

  return (
    `(function(){try{` +
    `var v=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});` +
    `if(v&&${JSON.stringify(ids)}.indexOf(v)>-1)` +
    `document.documentElement.setAttribute('data-theme',v);` +
    `}catch(e){}})()`
  );
}
