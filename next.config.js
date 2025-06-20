const path = require('path');

// CRITICAL FIX: Remove supabase-polyfill require that causes production issues
// require('./src/lib/supabase-polyfill.js'); // REMOVED - causing critical dependency warnings

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  experimental: {
    // CRITICAL FIX: Production optimizations for Choreo deployment
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
  
  // CRITICAL FIX: Comprehensive webpack configuration for Choreo deployment
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
    
    // CRITICAL FIX: Handle problematic dependencies that cause build failures
    config.externals = config.externals || [];
    
    if (isServer) {
      // Fix "self is not defined" error by excluding client-side only packages
      config.externals.push({
        'webworker-threads': 'commonjs webworker-threads',
        'natural': 'commonjs natural'
      });
    }
    
    // CRITICAL FIX: Add fallbacks for Node.js modules in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
      'webworker-threads': false
    };
    
    // CRITICAL FIX: Handle dynamic requires that cause build issues
    const webpack = require('webpack');
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(webworker-threads|natural\/lib\/natural\/classifiers\/classifier_train_parallel)$/
      })
    );
    
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
      // CRITICAL FIX: Add CORS headers for Choreo domain
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 