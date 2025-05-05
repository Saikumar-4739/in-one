import react from '@vitejs/plugin-react';
import path from 'path';

export default {
  root: __dirname,
  cacheDir: 'node_modules/.vite',  // Cache directory simplified
  server: {
    port: 4200,
    host: 'localhost',
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@in-one/shared-services': path.resolve(
        __dirname,
        '../libs/shared-services/src/index.ts'
      ),
      '@in-one/shared-models': path.resolve(
        __dirname,
        '../libs/shared-models/src/index.ts'
      ),
    },
  },
  build: {
    outDir: path.resolve(__dirname, '../../dist/packages/ui'),  // Simplified output directory to 'dist' in project root
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
    },
  },
  base: '/',
};
