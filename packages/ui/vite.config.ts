/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import path from 'path';

const projectRoot = __dirname; // /packages/ui

export default defineConfig({
  root: projectRoot,
  cacheDir: path.join(projectRoot, '../../node_modules/.vite/packages/ui'),

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
    nxCopyAssetsPlugin(['*.md']),
  ],

  build: {
    outDir: path.join(projectRoot, '../../dist/packages/ui'), // output OUTSIDE packages/
    emptyOutDir: true,
    reportCompressedSize: true,
    rollupOptions: {
      input: path.join(projectRoot, 'index.html'), // point directly to index.html
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
