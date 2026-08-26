import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// config setup
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // update behavior flag
      registerType: 'autoUpdate',
      // registration flag
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
        // navigation fallback rule
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // fonts cache rule
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // font files cache rule
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
        // dev toggle note
        enabled: false,
      },
    }),
  ],
})
