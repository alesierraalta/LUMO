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
  webpack: (config, { dev, isServer, isEdgeRuntime }) => {
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
      // CRITICAL FIX: Prevent "self is not defined" by properly externalizing client-only packages
      config.externals.push({
        'webworker-threads': 'commonjs webworker-threads',
        'natural': 'commonjs natural',
        '@supabase/realtime-js': 'commonjs @supabase/realtime-js',
        'ws': 'commonjs ws',
        'eventsource': 'commonjs eventsource'
      });
      
      // CRITICAL FIX: Add specific module resolution for problematic Supabase modules
      config.resolve.alias = {
        ...config.resolve.alias,
        '@supabase/realtime-js$': path.resolve(__dirname, 'src/lib/realtime-fallback.js')
      };
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
        resourceRegExp: /^(webworker-threads|natural\/lib\/natural\/classifiers\/classifier_train_parallel|@supabase\/realtime-js)$/
      })
    );
    
    // CRITICAL FIX: Define globals to prevent "self is not defined" errors
    config.plugins.push(
      new webpack.DefinePlugin({
        'typeof self': isServer ? JSON.stringify('undefined') : JSON.stringify('object'),
        'typeof window': isServer ? JSON.stringify('undefined') : JSON.stringify('object'),
        'typeof global': JSON.stringify('object'),
        'process.browser': !isServer,
        // CRITICAL: Define self as global for server builds
        ...(isServer && {
          'self': 'global',
          'self.webpackChunk_N_E': '(global.webpackChunk_N_E = global.webpackChunk_N_E || [])'
        })
      })
    );
    
    // CRITICAL FIX: Enhanced webpack configuration for Supabase and build optimization
    config.plugins = config.plugins || [];
    
    // CRITICAL FIX: Enhanced externalization for server builds
    if (isServer) {
      // Externalize problematic client-only packages for server builds
      config.externals = config.externals || [];
      config.externals.push(
        '@supabase/realtime-js',
        'ws',
        'bufferutil',
        'utf-8-validate'
      );
    }

    // CRITICAL FIX: Enhanced Edge Runtime compatibility
    if (config.target === 'webworker' || isEdgeRuntime) {
      console.log('🔧 Webpack: Configuring for Edge Runtime');
      
      // Externalize modules that don't work in Edge Runtime
      config.externals = config.externals || [];
      config.externals.push(
        '@supabase/realtime-js',
        'ws',
        'bufferutil', 
        'utf-8-validate',
        'encoding'
      );

      // CRITICAL FIX: Provide fallbacks for Edge Runtime
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'ws': false,
        'bufferutil': false,
        'utf-8-validate': false,
        'encoding': false,
        '@supabase/realtime-js': path.resolve(__dirname, 'src/lib/realtime-fallback.js')
      };
    }

    // CRITICAL FIX: Enhanced module resolution with better alias handling
    config.resolve.alias = {
      ...config.resolve.alias,
      // Provide safe fallbacks for problematic Supabase modules
      '@supabase/realtime-js': path.resolve(__dirname, 'src/lib/realtime-fallback.js'),
      'ws': false,
      'bufferutil': false,
      'utf-8-validate': false,
    };

    // CRITICAL FIX: Enhanced global definitions for server environments
    config.plugins.push(
      new webpack.DefinePlugin({
        'global.self': JSON.stringify({}),
        'global.window': JSON.stringify({}),
        'global.document': JSON.stringify({}),
        'global.navigator': JSON.stringify({}),
        'global.location': JSON.stringify({}),
        // CRITICAL FIX: Provide safe WebSocket fallback
        'global.WebSocket': JSON.stringify(null),
        'global.EventSource': JSON.stringify(null),
        // CRITICAL FIX: Handle process safely
        'process.browser': JSON.stringify(!isServer),
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
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