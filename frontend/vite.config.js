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
      includeAssets: ['favicon.png', 'favicon.svg'],
      manifest: {
        name: 'Greenlife Enterprise LLC',
        short_name: 'Greenlife',
        description: 'Sistema de control operativo y financiero',
        start_url: '/',
        display: 'standalone',
        background_color: '#061109',
        theme_color: '#00D084',
        orientation: 'portrait-primary',
        scope: '/',
        lang: 'es',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'favicon.png',
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
            name: 'Operaciones',
            short_name: 'Obras',
            description: 'Ir a proyectos y cotizaciones',
            url: '/operations',
            icons: [{ src: 'favicon.png', sizes: '192x192' }],
          },
          {
            name: 'Clientes',
            short_name: 'CRM',
            description: 'Ver cartera de clientes',
            url: '/crm',
            icons: [{ src: 'favicon.png', sizes: '192x192' }],
          },
          {
            name: 'Finanzas',
            short_name: 'Finanzas',
            description: 'Ver ingresos y gastos',
            url: '/finances',
            icons: [{ src: 'favicon.png', sizes: '192x192' }],
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
