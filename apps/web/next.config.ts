import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: false,
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) return [];
    return [
      // Exclude Next.js internal API routes from being proxied to backend
      { source: '/api/clear-session', destination: '/api/clear-session' },
      { source: '/api/:path*', destination: `${apiUrl}/:path*` },
    ];
  },

  async headers() {
    // R13-FE-001: Content Security Policy.
    // Starts in report-only mode for the first deploy cycle so we can gather
    // violations from real traffic without breaking the app. After 1-2 weeks
    // of clean reports, flip to `Content-Security-Policy` (enforcing).
    //
    // Allowances rationale:
    // - 'unsafe-inline' on script-src is needed by Next.js hydration scripts
    //   until we migrate to nonce-based CSP (app router supports nonces but
    //   existing pages use inline bootstrap). Tracked for removal.
    // - 'unsafe-inline' on style-src is needed by framer-motion and some
    //   Radix primitives that inject inline styles.
    // - connect-src allows the API URL and Sentry.
    const sentryOrigin = (() => {
      try {
        return process.env.NEXT_PUBLIC_SENTRY_DSN
          ? new URL(process.env.NEXT_PUBLIC_SENTRY_DSN).origin
          : '';
      } catch {
        return '';
      }
    })();
    const apiUrlOrigin = (() => {
      try {
        return process.env.NEXT_PUBLIC_API_URL
          ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
          : '';
      } catch {
        return '';
      }
    })();
    const connectSrc = ['\'self\'', apiUrlOrigin, sentryOrigin].filter(Boolean).join(' ');
    const isDev = process.env.NODE_ENV !== 'production';
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src ${connectSrc}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Content-Security-Policy', value: csp },
        ],
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
