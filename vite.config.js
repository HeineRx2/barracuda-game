import { defineConfig } from 'vite';

export default defineConfig({
  root: 'web_preview', // Source files are here
  build: {
    outDir: '../docs', // Build output to docs for GH Pages
    emptyOutDir: true, // Clean the docs folder before build
  },
  server: {
    port: 3000,
    open: true
  }
});
