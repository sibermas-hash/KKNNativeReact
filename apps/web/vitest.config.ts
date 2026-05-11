import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * Vitest config untuk apps/web.
 *
 * Mode default: jsdom (browser-like DOM) supaya React Testing Library bisa jalan.
 * Coverage: v8 engine, target file di src/ saja (exclude generated/build output).
 *
 * Running:
 *   pnpm test          — one-shot
 *   pnpm test:watch    — watch mode
 *   pnpm test:cov      — with coverage report
 */
export default defineConfig({
  plugins: [react() as unknown as never],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/**/index.ts',
      ],
    },
  },
});
