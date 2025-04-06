import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-icon-180.png',
        'masked-icon.svg'
      ],
      manifest: {
        name: 'Lets Stream V2.0',
        short_name: 'LetsStream',
        description: 'Watch your favorite movies and TV shows',
        theme_color: '#3b82f6',
        orientation: 'any',
        display_override: ['window-controls-overlay', 'browser', 'minimal-ui','fullscreen','standalone'],
        start_url: '/',
        screenshots: [
          {
            src: 'screenshot1.png',
            sizes: '1280x720',
            type: 'image/png',
            label: 'Screenshot 1',
            platform: 'any'
          },
          {
            src: 'screenshot2.png',
            sizes: '1280x720',
            type: 'image/png',
            label: 'Screenshot 2',
            platform: 'any'
          }
        ],
        categories: ["entertainment", "movies", "tv shows", "streaming"],
        prefer_related_applications: false,
        launch_handler: { client_mode: ['navigate-existing', 'auto'] },
        dir: 'ltr',
        icons: [
          {
            src: 'manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        background_color: '#0f0f0f',
        display: 'standalone',
        scope: '/'
      },
      workbox: {
        cleanupOutdatedCaches: true,
        
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\..*/, // API requests
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 72 * 60 * 60 // 72 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              matchOptions: {
                ignoreSearch: true
              }
            }
          },
          {
            // User-specific content
            urlPattern: /\/(profile|watch-history|preferences)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'user-cache',
              networkTimeoutSeconds: 2,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              },
              matchOptions: {
                ignoreSearch: true
              }
            }
          },
          {
            // Dynamic content pages
            urlPattern: /\/(movies|sports|trending)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'content-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 12 * 60 * 60 // 12 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              broadcastUpdate: {
                channelName: 'content-updates',
                options: {
                  notifyAllClients: true,
                  headersToCheck: ['etag', 'last-modified']
                }
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/, // Images
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\..*/, // Fonts
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/(firestore|firebase)\.googleapis\.com/, // Firebase routes
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 24 * 60 * 60 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              matchOptions: {
                ignoreSearch: true
              }
            }
          }
        ],

        // Skip waiting and claim clients for faster activation
        skipWaiting: true,
        clientsClaim: true,
        
        // Navigation fallback with specific exclusions
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/__/,           // Exclude internal routes
          /^\/api\//,        // Exclude API routes
          /\.[^.]+$/        // Exclude files with extensions
        ],
        
        // Development settings
        sourcemap: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
