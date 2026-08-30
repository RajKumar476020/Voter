import type { NextConfig } from 'next';

// Local dev: proxy /api to the standalone Nest API on :3001.
// In production on Vercel (voter-web-app.vercel.app) the API runs as a
// serverless function on the SAME host at /api — no external URL needed.
// Rewrites are only needed locally; in prod Next will hit /api directly.
const api = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const isProd = process.env.NODE_ENV === 'production' && process.env.VERCEL === '1';

const nextConfig: NextConfig = {
  async rewrites() {
    if (isProd) return [];
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
