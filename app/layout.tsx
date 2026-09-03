import type { Metadata, Viewport } from 'next';
import './globals.css';

import ThemeProvider from '@/components/theme/ThemeProvider';
import { getTheme } from '@/lib/themes';
import { themeStyleSheet } from '@/lib/themes/css';
import { themeInitScript } from '@/lib/themes/init-script';

export const metadata: Metadata = {
  title: 'Campus Geoguessr — Xavier University Ateneo de Cagayan',
  description:
    'Identify Xavier University campus locations from images and pin your best guess on a 2D campus map.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  // Uses the default theme; the browser reads this before any script runs
  themeColor: getTheme(null).colors.brand,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Suppress hydration warning for data-theme set by pre-paint script.
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Defines colors for all themes */}
        <style dangerouslySetInnerHTML={{ __html: themeStyleSheet() }} />
        {/* Loads stored theme before the page paints */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
