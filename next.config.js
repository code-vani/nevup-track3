/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ✅ FIX: seed/data.json ko Vercel standalone build mein include karo
  outputFileTracingIncludes: {
    '/api/local/**': ['./seed/**'],
  },
  compress: true,
  poweredByHeader: false,
  // Inline critical CSS to avoid render-blocking stylesheets
  experimental: {
    optimizeCss: false, // requires critters pkg; keep off unless installed
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/mock/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4010'}/:path*`,
      },
    ];
  },
};
module.exports = nextConfig;
