import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Galeria IA - InkDream',
        short_name: 'Galeria IA',
        description: 'Estúdio de tatuagem automatizado - Gerenciamento de posts, agendamento e IA',
        theme_color: '#1a1a2e',
        background_color: '#0f0f1a',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        categories: ['business', 'productivity', 'photo'],
        shortcuts: [
          {
            name: 'Novo Post',
            short_name: 'Novo',
            description: 'Criar novo post',
            url: '/upload',
            icons: [{ src: 'shortcut-upload.png', sizes: '192x192' }],
          },
          {
            name: 'Calendário',
            short_name: 'Calendário',
            description: 'Ver posts agendados',
            url: '/calendar',
            icons: [{ src: 'shortcut-calendar.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/wrybqqitsylqyhgzodyc\.supabase\.co\/rest\/v1\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              networkTimeoutSeconds: 10,
              plugins: [
                {
                  cacheWillUpdate: async ({ response }) => {
                    // Only cache successful responses
                    if (response.status === 200) {
                      return response;
                    }
                    return null;
                  },
                },
              ],
            },
          },
          {
            urlPattern: /^https:\/\/wrybqqitsylqyhgzodyc\.supabase\.co\/functions\/v1\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-functions',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 15,
            },
          },
          {
            urlPattern: /^https:\/\/api\.buffer\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'buffer-api',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/graph\.facebook\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'facebook-api',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs', '@radix-ui/react-tooltip'],
          'vendor-data': ['@tanstack/react-query', 'axios', 'zustand', 'date-fns'],
          'vendor-supabase': ['@supabase/supabase-js', '@supabase/realtime-js'],
          'vendor-google': ['@google/generative-ai'],
          'galeria-components': [
            './src/components/calendar/CalendarView.tsx',
            './src/components/upload/UploadZone.tsx',
            './src/components/posts/PostCard.tsx',
            './src/components/sidebar/Sidebar.tsx',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    host: true,
  },
});