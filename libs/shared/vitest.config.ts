import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**'],
  },
  resolve: {
    alias: {
      '@dooform/shared': path.resolve(__dirname, './src'),
    },
  },
});
