/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    cssChunking: 'strict',
  },
  // Configure webpack to handle the logger modules properly
  webpack: (config, { isServer, buildId }) => {
    // Handle logger modules for different runtimes
    if (isServer) {
      config.externals = [...(config.externals || []), 'fs', 'path'];
    }
    
    return config;
  },
  // Configure serverComponentsExternalPackages for Prisma and logger
  serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  
  // Environment variables to be embedded in the client
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
  
  // Output configuration
  output: 'standalone',
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  
  // Headers configuration for SSL and CORS
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
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
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      {
        // Allow Clerk resources from official CDN
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With, X-Correlation-ID',
          },
        ],
      },
    ];
  },
  
  // Rewrites for Clerk SSL compatibility
  async rewrites() {
    return [
      {
        source: '/clerk/:path*',
        destination: 'https://js.clerk.com/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 