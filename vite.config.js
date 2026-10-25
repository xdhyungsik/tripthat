import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import flightLookup from './api/flight-lookup.js'

// Serves the /api functions during `npm run dev`; Vercel runs them in production
function devApi() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/flight-lookup', flightLookup)
    },
  }
}

export default defineConfig(({ mode }) => {
  // Expose server-only secrets (no VITE_ prefix) to the dev middleware, never to the client bundle
  const { RAPIDAPI_KEY } = loadEnv(mode, process.cwd(), '')
  if (RAPIDAPI_KEY) process.env.RAPIDAPI_KEY = RAPIDAPI_KEY

  return {
    plugins: [
      react(),
      devApi(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          name: 'TripThat',
          short_name: 'TripThat',
          description: 'Plan and organize your multi-city adventures',
          theme_color: '#2563eb',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
    ],
  }
})
