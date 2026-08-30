import type { NextConfig } from 'next';

// In production the API is NOT localhost — set API_URL / NEXT_PUBLIC_API_URL
// to your deployed API (e.g. https://voter-api.onrender.com). Falls back to
// localhost for local dev. The rewrite proxies /api/v1/* to that target.
const api =
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
