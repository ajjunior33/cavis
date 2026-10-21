import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Cores da marca. Manter em sincronia com --surface (src/index.css)
// e com a meta theme-color (index.html).
const THEME_COLOR = '#f5f6ff'
const BACKGROUND_COLOR = '#f5f6ff'

// O service worker é serializado como texto, então o matcher precisa ser uma
// RegExp (funções não enxergam variáveis do config). Casa tanto uma URL
// absoluta (https://api.exemplo.com) quanto um prefixo relativo (/api).
function apiUrlPattern(apiUrl: string | undefined) {
  const base = (apiUrl ?? '').replace(/\/+$/, '')
  if (!base) return null

  const escaped = base.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')
  return new RegExp(/^https?:\/\//.test(base) ? `^${escaped}` : `^https?://[^/]+${escaped}`)
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiPattern = apiUrlPattern(env.VITE_API_URL)

  if (!apiPattern) {
    console.warn('[pwa] VITE_API_URL não definido: nenhuma regra NetworkOnly para a API foi gerada.')
  }

  return {
    plugins: [
      // O plugin do TanStack Router precisa vir ANTES do plugin do React
      tanstackRouter({
        target: 'react',
        routesDirectory: './src/routes',
        generatedRouteTree: './src/routeTree.gen.js',
        autoCodeSplitting: true,
        disableTypes: true,
      }),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'generateSW',
        includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'Clavis',
          short_name: 'Clavis',
          description: 'Clavis: seu app, direto do celular.',
          lang: 'pt-BR',
          dir: 'ltr',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          theme_color: THEME_COLOR,
          background_color: BACKGROUND_COLOR,
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            {
              src: '/icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          // App shell: JS, CSS, HTML, fontes e imagens do build ficam em precache
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
          navigateFallback: '/index.html',
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          // Respostas da API são dados do usuário: nunca ficam em cache.
          // Esta regra vem primeiro e vai sempre à rede.
          runtimeCaching: apiPattern
            ? [{ urlPattern: apiPattern, handler: 'NetworkOnly' }]
            : [],
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})
