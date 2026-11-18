import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

function commit(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'local';
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __COMMIT__: JSON.stringify(commit()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      includeAssets: ['icono.svg', 'icono-192.png', 'icono-512.png'],
      manifest: {
        name: 'Titanus',
        short_name: 'Titanus',
        description: 'Entrenamiento · Disciplina · Fuerza. Registrá cada serie como un legionario.',
        lang: 'es',
        theme_color: '#090909',
        background_color: '#090909',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icono-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icono-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,mp3}'],
        // Las carátulas de programas no se descargan al instalar: se guardan la primera vez que se ven
        globIgnores: ['programas/**'],
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.startsWith('/programas/') && url.pathname.endsWith('.webp'),
          handler: 'CacheFirst',
          options: { cacheName: 'caratulas', expiration: { maxEntries: 60 } },
        }],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 700 },
  server: { port: 5173 },
});
