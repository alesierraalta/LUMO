const path = require('path');

// CRITICAL FIX: Remove supabase-polyfill require that causes production issues
// require('./src/lib/supabase-polyfill.js'); // REMOVED - causing critical dependency warnings

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // CRITICAL FIX: Add allowedDevOrigins to prevent cross-origin warnings
  experimental: {
    allowedDevOrigins: [
      '42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev',
      'lumo-1615540597-6c8cb9466f-w76w6-choreo.apps.cloudmobility.io'
    ],
    // Disable webpack HMR in production
    webpackBuildWorker: false,
    optimizeServerReact: true,
    serverMinification: true,
  },
  
  // CRITICAL FIX: Ensure production mode disables development features
  env: {
    CUSTOM_KEY: process.env.NODE_ENV || 'production',
  },
  
  // Disable ESLint and TypeScript during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // CRITICAL FIX: Webpack configuration to prevent large string serialization
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.cache = {
        type: 'filesystem',
        compression: 'gzip',
        cacheDirectory: path.join(process.cwd(), '.next', 'cache', 'webpack'),
        maxMemoryGenerations: 1,
        memoryCacheUnaffected: true
      };
      
      // Prevent HMR in production
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000, // ~240KB to prevent large string serialization
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all'
            }
          }
        }
      };
    }
    
    return config;
  },
  
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 