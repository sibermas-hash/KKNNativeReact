import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read version from package.json
const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
const appVersion = pkg.version || '4.0';

export default defineConfig({
  plugins: [
    laravel({
      input: 'resources/js/app.tsx',
      refresh: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': '/resources/js',
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  server: {
    host: 'localhost',
    watch: {
      ignored: ['**/storage/framework/views/**'],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./resources/js/setupTests.ts'],
    globals: true,
    css: true,
  },
});
