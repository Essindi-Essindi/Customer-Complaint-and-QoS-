import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Silently swaps in new precached assets in the background and
      // activates them once useRegisterSW (PwaUpdatePrompt.tsx) confirms the
      // user wants to reload, rather than forcing an update on next visit.
      registerType: 'autoUpdate',
      // Registration is done manually via useRegisterSW in
      // PwaUpdatePrompt.tsx (so it can drive an in-app update banner);
      // don't also inject the plugin's own auto-registering script.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons.svg', 'Camtel logo.png'],
      manifest: {
        name: 'CAMTEL Complaint Platform',
        short_name: 'CAMTEL',
        description:
          'Submit and track CAMTEL service complaints as a subscriber, or manage them as staff.',
        start_url: '/welcome',
        scope: '/',
        display: 'standalone',
        background_color: '#050914',
        theme_color: '#050914',
        icons: [
          { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precached app-shell navigations should never fall back for API
        // calls — this only affects `mode: 'navigate'` requests (page
        // loads), not the fetch()/XHR calls complaintsApi etc. make, but is
        // cheap insurance against ever serving index.html for an /api/ URL.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Google Fonts stylesheet — small and changes rarely, but check
            // for updates in the background rather than caching forever.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // The actual font files are immutable per URL, so cache-first
            // with a long expiry is safe and keeps the UI legible offline.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        // The service worker only activates in a real build (`vite build` +
        // `vite preview`) — enabling it under `vite dev` mostly just adds
        // noise and stale-cache confusion during development.
        enabled: false,
      },
    }),
  ],
})
