import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'manifest.json',
      strategies: 'generateSW',
      includeAssets: ['favicon.png', 'favicon.svg', 'logo_sr.png'],
      manifest: {
        name: 'Greenlife Enterprise LLC',
        short_name: 'Greenlife',
        description: 'Sistema de punto de venta y control operativo',
        start_url: '/',
        display: 'standalone',
        background_color: '#061109',
        theme_color: '#00D084',
        orientation: 'portrait-primary',
        scope: '/',
        lang: 'es',
        icons: [
          {
            src: 'logo_sr.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'logo_sr.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'favicon.png',
            sizes: '32x32',
            type: 'image/png',
          }
        ],
        shortcuts: [
          {
            name: 'Nueva Venta',
            short_name: 'Ventas',
            description: 'Ir al punto de venta',
            url: '/pos',
            icons: [{ src: 'logo_sr.png', sizes: '96x96' }],
          },
          {
            name: 'Inventario',
            short_name: 'Stock',
            description: 'Ver inventario actual',
            url: '/inventory',
            icons: [{ src: 'logo_sr.png', sizes: '96x96' }],
          },
        ],
        categories: ['business', 'finance', 'productivity'],
      },
      workbox: {
        // Cachear assets del frontend
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Asegurar que las rutas de navegación (como /login) funcionen offline
        navigateFallback: 'index.html',
        navigateFallbackAllowlist: [/^(?!\/__).*/], // Ignorar rutas internas de Firebase/Vite si las hay
        // Estrategia: intenta red primero, luego cache (para el API)
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutos
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
              },
            },
          },
        ],
      },
      // Genera el service worker automáticamente
      devOptions: {
        enabled: true, 
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.jsx',
    css: true,
  },
})
