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
    
    // OPTIMIZATION: Development startup optimizations
    optimizePackageImports: ['@supabase/supabase-js'],
    memoryBasedWorkersCount: true,
  },
  
  // CRITICAL FIX: Ensure production mode disables development features
  env: {
    CUSTOM_KEY: process.env.NODE_ENV || 'production',
    // OPTIMIZATION: Development startup optimizations
    NEXT_TELEMETRY_DISABLED: '1',
    DISABLE_ESLINT_PLUGIN: 'true',
  },
  
  // Disable ESLint and TypeScript during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Force production optimizations
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
  
  // Optimize for deployment
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // CRITICAL FIX: Enhanced webpack configuration for Choreo deployment with aggressive Supabase handling
  webpack: (config, { dev, isServer, isEdgeRuntime }) => {
    // OPTIMIZATION: Development optimizations for faster startup
    if (dev) {
      // Optimize development builds for faster compilation
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      // Reduce file watching overhead
      config.watchOptions = {
        poll: false,
        aggregateTimeout: 300,
      };
    }
    
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
    
    // CRITICAL FIX: Aggressive externalization for Supabase realtime issues
    config.externals = config.externals || [];
    
    if (isServer) {
      // CRITICAL FIX: Comprehensive server-side externalization
      config.externals.push({
        '@supabase/realtime-js': 'commonjs @supabase/realtime-js',
        'ws': 'commonjs ws',
        'bufferutil': 'commonjs bufferutil',
        'utf-8-validate': 'commonjs utf-8-validate',
        'encoding': 'commonjs encoding',
        'webworker-threads': 'commonjs webworker-threads',
        'natural': 'commonjs natural'
      });
    }
    
    // CRITICAL FIX: Enhanced module resolution with comprehensive aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      // Aggressive aliasing for problematic Supabase modules
      '@supabase/realtime-js': path.resolve(__dirname, 'src/lib/realtime-fallback.js'),
      '@supabase/realtime-js/dist/module/RealtimeClient': path.resolve(__dirname, 'src/lib/realtime-fallback.js'),
      '@supabase/realtime-js/dist/module/RealtimeChannel': path.resolve(__dirname, 'src/lib/realtime-fallback.js'),
      '@supabase/realtime-js/dist/module/types': path.resolve(__dirname, 'src/lib/realtime-fallback.js'),
    };
    
    // CRITICAL FIX: Enhanced fallbacks for Node.js modules in browser
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
      'webworker-threads': false,
      '@supabase/realtime-js': path.resolve(__dirname, 'src/lib/realtime-fallback.js'),
      'ws': false,
      'bufferutil': false,
      'utf-8-validate': false,
      'encoding': false
    };
    
    // CRITICAL FIX: Enhanced webpack plugins for Supabase compatibility
    const webpack = require('webpack');
    
    // Ignore problematic modules completely
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(@supabase\/realtime-js|ws|bufferutil|utf-8-validate|encoding|webworker-threads)$/
      })
    );
    
    // CRITICAL FIX: Enhanced global definitions for all environments
    config.plugins.push(
      new webpack.DefinePlugin({
        'typeof self': isServer ? JSON.stringify('undefined') : JSON.stringify('object'),
        'typeof window': isServer ? JSON.stringify('undefined') : JSON.stringify('object'),
        'typeof global': JSON.stringify('object'),
        'process.browser': !isServer,
        // CRITICAL: Enhanced server environment handling
        ...(isServer && {
          'self': 'global',
          'window': 'undefined',
          'document': 'undefined',
          'navigator': 'undefined',
          'location': 'undefined'
        })
      })
    );
    
    // CRITICAL FIX: Enhanced Edge Runtime compatibility
    if (config.target === 'webworker' || isEdgeRuntime) {
      console.log('🔧 Webpack: Enhanced Edge Runtime configuration for Supabase');
      
      // Comprehensive externalization for Edge Runtime
      config.externals = config.externals || [];
      config.externals.push(
        '@supabase/realtime-js',
        'ws',
        'bufferutil', 
        'utf-8-validate',
        'encoding',
        'webworker-threads',
        'natural'
      );

      // Enhanced fallbacks for Edge Runtime
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@supabase/realtime-js': path.resolve(__dirname, 'src/lib/realtime-fallback.js'),
        'ws': false,
        'bufferutil': false,
        'utf-8-validate': false,
        'encoding': false
      };
    }
    
    // CRITICAL FIX: Enhanced NormalModuleReplacementPlugin for aggressive module replacement
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /@supabase\/realtime-js/,
        path.resolve(__dirname, 'src/lib/realtime-fallback.js')
      )
    );
    
    // CRITICAL FIX: Additional module replacement for nested imports
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@supabase\/realtime-js\/dist\/module\/RealtimeClient$/,
        path.resolve(__dirname, 'src/lib/realtime-fallback.js')
      )
    );
    
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^@supabase\/realtime-js\/dist\/module\/RealtimeChannel$/,
        path.resolve(__dirname, 'src/lib/realtime-fallback.js')
      )
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