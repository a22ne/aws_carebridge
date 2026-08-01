import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@carebridge/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@carebridge/i18n': path.resolve(__dirname, '../../packages/i18n/src/index.ts'),
      '@carebridge/clinical-rules': path.resolve(__dirname, '../../packages/clinical-rules/src/index.ts'),
    },
  },
  server: {
    port: 3000,
  },
});
