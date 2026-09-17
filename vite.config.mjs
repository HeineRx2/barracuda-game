import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: './', // Source files are here
  base: './', // CRITICAL for GitHub Pages sub-directories
  build: {
    outDir: './docs', // Build output to docs for GH Pages
    emptyOutDir: true, // Clean the docs folder before build
  },
  server: {
    port: 3000,
    open: true
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'BARRACUDA TACTICAL',
        short_name: 'BARRACUDA',
        description: 'BARRACUDA FPV Drone Tactical Simulator',
        theme_color: '#002233',
        background_color: '#00111a',
        display: 'standalone',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/9101/9101314.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/9101/9101314.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
