import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        runtimeCaching: [
          {
            // Leituras de dados: rede primeiro, cache como reserva offline
            urlPattern: ({ url, request }) =>
              url.hostname.endsWith('.supabase.co') &&
              url.pathname.startsWith('/rest/v1/') &&
              request.method === 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dados',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
          {
            // Fotos assinadas: cache primeiro (o conteúdo do path nunca muda)
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') &&
              url.pathname.includes('/storage/v1/object/sign/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'fotos',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      manifest: {
        name: 'RDO Diário',
        short_name: 'RDO',
        description: 'Relatório diário de obra e registro de aprendizado',
        lang: 'pt-BR',
        theme_color: '#fcfcfb',
        background_color: '#f9f9f7',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
