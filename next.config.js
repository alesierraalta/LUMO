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
      {
        // Specific headers for Clerk proxy routes
        source: '/clerk-proxy/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Content-Security-Policy',
            value: "connect-src 'self' https://js.clerk.com https://*.clerk.accounts.dev https://*.clerk.com",
          },
        ],
      },
    ];
  },
  
  // Comprehensive rewrites for Clerk SSL compatibility
  async rewrites() {
    return [
      // Clerk JavaScript SDK rewrites
      {
        source: '/clerk-proxy/v1/:path*',
        destination: 'https://js.clerk.com/v1/:path*',
      },
      {
        source: '/clerk-proxy/npm/:path*',
        destination: 'https://js.clerk.com/npm/:path*',
      },
      
      // Legacy Clerk rewrites
      {
        source: '/clerk/:path*',
        destination: 'https://js.clerk.com/:path*',
      },
      
      // Clerk API rewrites (for frontend API calls)
      {
        source: '/clerk-api/:path*',
        destination: 'https://api.clerk.com/:path*',
      },
      
      // Clerk accounts rewrites
      {
        source: '/clerk-accounts/:path*',
        destination: 'https://accounts.clerk.com/:path*',
      },
    ];
  },

  // Redirects to handle Choreo-specific SSL issues
  async redirects() {
    return [
      // Only apply in production (Choreo environment)
      ...(process.env.NODE_ENV === 'production' ? [
        {
          source: '/js.clerk.com/:path*',
          destination: '/clerk-proxy/:path*',
          permanent: false,
        },
      ] : []),
    ];
  },
};

module.exports = nextConfig; 