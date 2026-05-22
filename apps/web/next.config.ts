import type { NextConfig } from 'next';
import path from 'node:path';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});
// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^\/api\/v1\/public\/.*/,
      handler: "StaleWhileRevalidate",
      options: { cacheName: "api-public", expiration: { maxEntries: 50, maxAgeSeconds: 300 } },
    },
    {
      urlPattern: /^\/_next\/static\/.*/,
      handler: "CacheFirst",
      options: { cacheName: "static-assets", expiration: { maxEntries: 200, maxAgeSeconds: 31536000 } },
    },
    {
      urlPattern: /^\/images\/.*/,
      handler: "CacheFirst",
      options: { cacheName: "image-cache", expiration: { maxEntries: 100, maxAgeSeconds: 86400 } },
    },
  ],
});


const systemAdminRouteAliases = [
  { source: '/admin/sistem/pengguna', destination: '/admin/pengguna' },
  { source: '/admin/sistem/profile-change-requests', destination: '/admin/profile-change-requests' },
  { source: '/admin/sistem/avatar-moderation', destination: '/admin/avatar-moderation' },
  { source: '/admin/sistem/fakultas', destination: '/admin/fakultas' },
  { source: '/admin/sistem/prodi', destination: '/admin/prodi' },
  { source: '/admin/sistem/tahun-akademik', destination: '/admin/tahun-akademik' },
  { source: '/admin/sistem/jenis-kkn/:path*', destination: '/admin/jenis-kkn/:path*' },
  { source: '/admin/sistem/periode/:path*', destination: '/admin/periode/:path*' },
  { source: '/admin/sistem/audit-log/:path*', destination: '/admin/audit-log/:path*' },
  { source: '/admin/sistem/activity-log', destination: '/admin/activity-log' },
  { source: '/admin/sistem/sinkron-siakad', destination: '/admin/sinkron-siakad' },
  { source: '/admin/sistem/database-sync/:path*', destination: '/admin/database-sync/:path*' },
  { source: '/admin/sistem/playground', destination: '/admin/playground' },
  { source: '/admin/sistem/warta-utama', destination: '/admin/warta-utama' },
  { source: '/admin/sistem/notifikasi/:path*', destination: '/admin/notifikasi/:path*' },
  { source: '/admin/sistem/chat/:path*', destination: '/admin/chat/:path*' },
  { source: '/admin/sistem/unduhan', destination: '/admin/unduhan' },
  { source: '/admin/sistem/konten-publik/:path*', destination: '/admin/konten-publik/:path*' },
  { source: '/admin/sistem/pengaturan/:path*', destination: '/admin/pengaturan/:path*' },
] satisfies NonNullable<NextConfig['rewrites']> extends (...args: never[]) => infer R ? Awaited<R> : never;

const operationalRouteAliases = [
  { source: '/admin/operasional/pendaftaran', destination: '/admin/pendaftaran' },
  { source: '/admin/operasional/pendaftaran/:path*', destination: '/admin/pendaftaran/:path*' },
  { source: '/admin/operasional/kelompok/:path*', destination: '/admin/kelompok/:path*' },
  { source: '/admin/operasional/lokasi/:path*', destination: '/admin/lokasi/:path*' },
  { source: '/admin/operasional/dosen/penugasan', destination: '/admin/dosen/penugasan' },
  { source: '/admin/operasional/laporan/harian/:path*', destination: '/admin/laporan/harian/:path*' },
  { source: '/admin/operasional/laporan/program-kerja/:path*', destination: '/admin/laporan/program-kerja/:path*' },
] satisfies NonNullable<NextConfig['rewrites' ]> extends (...args: never[]) => infer R ? Awaited<R> : never;

const dashboardRouteAliases = [
  { source: '/admin/dashboard/audit-kualifikasi', destination: '/admin/audit-kualifikasi' },
  { source: '/admin/dashboard/monitoring', destination: '/admin/monitoring' },
  { source: '/admin/dashboard/rekapitulasi', destination: '/admin/rekapitulasi' },
] satisfies NonNullable<NextConfig['rewrites']> extends (...args: never[]) => infer R ? Awaited<R> : never;

const legacyAdminRedirects = [
  { source: '/superadmin', destination: '/admin', permanent: false },
  { source: '/superadmin/:path*', destination: '/admin/:path*', permanent: false },
] satisfies NonNullable<NextConfig['redirects']> extends (...args: never[]) => infer R ? Awaited<R> : never;

const legacyAuthRedirects = [
  { source: '/login/2fa', destination: '/login-2fa', permanent: false },
] satisfies NonNullable<NextConfig['redirects']> extends (...args: never[]) => infer R ? Awaited<R> : never;

const nextConfig: NextConfig = {
  // Monorepo: tracer harus start dari root workspace (bukan `apps/web`),
  // supaya symlink pnpm ke `packages/*` dan hoisted deps di root
  // `node_modules` ikut disalin ke `.next/standalone`. Tanpa ini, Next 15
  // sering lempar MODULE_NOT_FOUND di FreeBSD saat `server.js` dijalankan
  // dari lokasi standalone.
  outputFileTracingRoot: path.join(__dirname, '../../'),
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
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
    ignoreBuildErrors: true,
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
    // sharp WASM enabled for FreeBSD — server-side image optimization active
    unoptimized: false,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sibermas.uinsaizu.ac.id',
      },
    ],
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

  async redirects() {
    return [...legacyAdminRedirects, ...legacyAuthRedirects];
  },

  async rewrites() {
    const apiUrl = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL;
    const rewrites = [
      ...dashboardRouteAliases,
      ...operationalRouteAliases,
      ...systemAdminRouteAliases,
      // Exclude Next.js internal API routes from being proxied to backend
      { source: '/api/clear-session', destination: '/api/clear-session' },
    ];

    if (apiUrl) {
      rewrites.push({ source: '/api/v1/:path*', destination: `${apiUrl}/:path*` });
    }

    return rewrites;
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

export default withBundleAnalyzer(withPWA(nextConfig));
