import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [
    '@sibermas/shared-types',
    '@sibermas/api-client',
    '@sibermas/schemas',
    '@sibermas/hooks',
    '@sibermas/constants',
  ],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
