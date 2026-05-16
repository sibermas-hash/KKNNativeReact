import type { NextConfig } from 'next';
import path from 'node:path';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  // Monorepo: tracer harus start dari root workspace (bukan `apps/web`),
  // supaya symlink pnpm ke `packages/*` dan hoisted deps di root
  // `node_modules` ikut disalin ke `.next/standalone`. Tanpa ini, Next 15
  // sering lempar MODULE_NOT_FOUND di FreeBSD saat `server.js` dijalankan
  // dari lokasi standalone.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: false,
  },
  // ─────────────────────────────────────────────────────────────────────
  // TEMPORARY (2026-05-12): skip TypeScript type-check di build.
  //
  // Alasan: workspace saat ini punya ±250 type error pre-existing (tersebar
  // di 33 file app/admin, app/dosen, app/mahasiswa) yang bermuara dari
  // queryFn React Query yang return type-nya ter-infer sebagai `{}` karena
  // pola `(res as {data?: unknown}).data ?? res`. Runtime tetap aman karena
  // semua akses pakai optional chaining + cast `as`, tapi `next build` akan
  // gagal di tahap type-check.
  //
  // Cleanup plan: lihat docs/TECH_DEBT_TYPE_ERRORS.md. Setelah list di situ
  // dikosongkan, HAPUS flag ini dan buka kembali type-check.
  //
  // DO NOT set `true` untuk menambal error baru tanpa mencatat di doc.
  // ─────────────────────────────────────────────────────────────────────
  typescript: {
    ignoreBuildErrors: false,
  },
  serverExternalPackages: ['canvas', 'jsdom', 'isomorphic-dompurify'],
  devIndicators: false,

  // ── Performance ─────────────────────────────────────────────────────────
  compress: true,
  reactStrictMode: true,
  poweredByHeader: false,
  generateEtags: true,

  // ── Image Optimization ──────────────────────────────────────────────────
  images: {
    // FreeBSD jail deploy runs Next standalone without relying on native sharp.
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },

  experimental: {
    // Monorepo: izinkan resolve import di luar `apps/web` (mis. `packages/*`).
    // Tanpa flag ini, Next 15 tracer kadang tidak ikut sertakan file di
    // luar cwd yang dibutuhkan standalone build — terutama di monorepo
    // pnpm dengan symlink. Bersama `.npmrc` `node-linker=hoisted` ini
    // mengeliminasi error "Cannot find module '../../lib/get-network-host'"
    // di FreeBSD production.
    externalDir: true,
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      'clsx',
      'zod',
      'react-hook-form',
      '@hookform/resolvers',
      'recharts',
      '@radix-ui/react-progress',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
    ],
  },

  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },

  transpilePackages: [
    '@sibermas/shared-types',
    '@sibermas/api-client',
    '@sibermas/schemas',
    '@sibermas/hooks',
    '@sibermas/constants',
    'framer-motion',
  ],

  async rewrites() {
    const apiUrl = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];
    return [
      // Exclude Next.js internal API routes from being proxied to backend
      { source: '/api/clear-session', destination: '/api/clear-session' },
      { source: '/api/v1/:path*', destination: `${apiUrl}/:path*` },
    ];
  },

  async headers() {
    return [
      {
        source: '/',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }],
      },
      {
        source: '/login',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }],
      },
      {
        source: '/lupa-kata-sandi',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }],
      },
      {
        source: '/atur-ulang-kata-sandi',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }],
      },
      {
        source: '/ganti-password',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }],
      },
      {
        source: '/',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }],
      },
      {
        source: '/login',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }],
      },
      {
        source: '/lupa-kata-sandi',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }],
      },
      {
        source: '/atur-ulang-kata-sandi',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }],
      },
      {
        source: '/ganti-password',
        headers: [{ key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' }],
      },
      {
        // Long-term immutable cache for hashed static assets
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Cache public images
        source: '/images/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        // Cache fonts (served by Next.js)
        source: '/_next/static/media/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
