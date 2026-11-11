import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'Swarnkar Jewellers ERP',
          short_name: 'Swarnkar',
          description: 'Comprehensive Indian Jewellery Store ERP with POS billing and inventory.',
          theme_color: '#f59e0b',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: '/src/assets/images/swarnkar_pwa_logo_1794386156978.jpg',
              sizes: '1024x1024',
              type: 'image/jpeg',
              purpose: 'any'
            },
            {
              src: '/src/assets/images/swarnkar_pwa_logo_1794386156978.jpg',
              sizes: '192x192',
              type: 'image/jpeg',
              purpose: 'any'
            },
            {
              src: '/src/assets/images/swarnkar_pwa_logo_1794386156978.jpg',
              sizes: '512x512',
              type: 'image/jpeg',
              purpose: 'any'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5242880, // 5MB
          navigateFallbackDenylist: [/^\/api/, /googleapis\.com/, /firebase/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/(firestore|identitytoolkit|securetoken|firebase|googleapis)\.googleapis\.com\/.*/i,
              handler: 'NetworkOnly'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
