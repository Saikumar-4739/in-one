import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Root directory of your project
  root: __dirname,

  // Cache directory for Vite's internal cache
  cacheDir: 'node_modules/.vite',

  // Server configuration for local development
  server: {
    port: 4200,
    host: 'localhost',
  },

  // Preview server configuration for local production preview
  preview: {
    port: 4300,
    host: 'localhost',
  },

  // Plugins (React plugin for Vite)
  plugins: [react()],

  // Path alias configuration for easier imports
  resolve: {
    alias: {
      '@in-one/shared-services': path.resolve(__dirname, '../libs/shared-services/src/index.ts'),
      '@in-one/shared-models': path.resolve(__dirname, '../libs/shared-models/src/index.ts'),
    },
  },

  // Build settings
  build: {
    // Output directory (make sure this aligns with your deployment settings)
    outDir: path.resolve(__dirname, '../../dist/packages/ui'),  // Ensure this points to the correct output directory

    // Make sure Vite cleans the output directory before building
    emptyOutDir: true,

    // Enable reporting compressed sizes for better optimization insights
    reportCompressedSize: true,

    // CommonJS options (for compatibility with mixed ES and CommonJS modules)
    commonjsOptions: {
      transformMixedEsModules: true,
    },

    // Rollup options (if you're using external dependencies that don't need bundling)
    rollupOptions: {
      external: [],
    },
  },

  // Ensure base path is correct for production
  base: '/',  // If your app is deployed on a subpath, adjust this (e.g., '/my-app/')
});
