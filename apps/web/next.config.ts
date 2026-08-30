import type { NextConfig } from 'next';

const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: `${api}/api/v1/:path*` },
      { source: '/uploads/:path*', destination: `${api}/uploads/:path*` },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
