import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  output: 'standalone',
  serverExternalPackages: ['canvas', 'jsdom', 'isomorphic-dompurify'],
  devIndicators: false,
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
  ],
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
