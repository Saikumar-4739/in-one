import react from '@vitejs/plugin-react';
import path from 'path';

export default {
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/ui',
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
    outDir: '../../dist/packages/ui',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [],
    },
  },
};
