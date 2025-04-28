/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import path from 'path';

export default defineConfig({
  root: __dirname, // Ensure the root is the directory where vite.config.js is located
  cacheDir: path.resolve(__dirname, '../../node_modules/.vite/packages/ui'), // Cache directory resolved correctly

  server: {
    port: 4200,
    host: 'localhost',
  },

  preview: {
    port: 4300,
    host: 'localhost',
  },

  plugins: [
    react(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']), // Copy Markdown files
  ],

  build: {
    outDir: path.resolve(__dirname, '../../dist/packages/ui'), // Correct output directory
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      input: path.resolve(__dirname, 'ui/index.html'), // Update this path to reflect the actual location of index.html
    },
  },

  // Uncomment and configure the worker settings if needed
  // worker: {
  //   plugins: [nxViteTsPaths()],
  // },
});
