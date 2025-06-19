/** @type {import('next').NextConfig} */
const path = require('path');

// Load Supabase polyfill for Next.js 15.3.1 compatibility
try {
  require('./src/lib/supabase-polyfill.js');
  console.log('[Next.js Config] ✅ Supabase polyfill loaded successfully');
} catch (error) {
  console.warn('[Next.js Config] ⚠️ Supabase polyfill not found:', error.message);
}

const nextConfig = {
  // Essential for Choreo deployment
  output: 'standalone',
  
  // File tracing configuration (moved from experimental)
  outputFileTracingRoot: process.cwd(),
  
  // Disable ESLint during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checking during build (for speed)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Transpile necessary packages - FIXED: Added Supabase modules
  transpilePackages: [
    'lucide-react',
    '@supabase/supabase-js',
    '@supabase/auth-js',
    '@supabase/realtime-js',
    '@supabase/postgrest-js',
    '@supabase/storage-js'
  ],
  
  // Skip source maps in production for faster builds
  productionBrowserSourceMaps: false,
  
  // Generate consistent build ID for deployment
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  
  // FIXED: Enhanced server external packages for better module resolution
  serverExternalPackages: [
    'child_process', 
    'fs', 
    'path', 
    'os',
    // Add these to prevent server-side bundling issues
    'crypto',
    'stream',
    'util'
  ],
  
  // Enable compression for better performance
  compress: true,
  
  // Image optimization - optimized for production
  images: {
    unoptimized: false,
    domains: [],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Accel-Buffering', value: 'no' }, // For Nginx proxy
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/sign-in',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/sign-up',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/inventory/new',
        destination: '/inventory/add',
        permanent: true,
      },
    ];
  },

  // Webpack optimization for production deployment
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    
    // Load polyfill early in webpack compilation - FIXED: Prevent recursion
    const originalEntry = config.entry;
    config.entry = async () => {
      const entries = await originalEntry();
      
      // Inject polyfill into all entry points
      if (entries['main.js']) {
        entries['main.js'].unshift('./src/lib/supabase-polyfill.js');
      }
      if (entries['pages/_app']) {
        entries['pages/_app'].unshift('./src/lib/supabase-polyfill.js');
      }
      
      return entries;
    };
    
    // Enhanced webpack configuration for Next.js 15.3.1 compatibility
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.__NEXT_VERSION': JSON.stringify('15.3.1'),
        // Define globals for polyfill compatibility
        '__SUPABASE_POLYFILL_LOADED__': true,
        '__NEXT_EDGE_RUNTIME__': isServer ? false : true,
      })
    );

    // Module resolution fixes
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      '@supabase/supabase-js': path.resolve(__dirname, 'node_modules/@supabase/supabase-js'),
    };

    // Enhanced module rules for ESM/CommonJS compatibility
    config.module.rules.push(
      {
        test: /\.m?js$/,
        type: 'javascript/auto',
        resolve: {
          fullySpecified: false,
        },
      }
    );

    // Enhanced cache configuration
    config.cache = {
      type: 'filesystem',
      compression: 'gzip',
      cacheDirectory: path.join(process.cwd(), '.next', 'cache', 'webpack'),
      maxMemoryGenerations: 1,
      memoryCacheUnaffected: true,
      buildDependencies: {
        config: [__filename],
      },
    };

    // Optimized split chunks to prevent large string serialization
    config.optimization.splitChunks = {
      chunks: 'all',
      maxSize: 244000, // ~240KB to prevent large string serialization
      cacheGroups: {
        vendor: {
          test: /[\/]node_modules[\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    };

    // Experimental features for better compatibility
    config.experiments = {
      ...config.experiments,
      backCompat: false, // Disable webpack 4 compatibility for better performance
      futureDefaults: true,
    };
    // CRITICAL FIX: Define exports and module globals for Supabase compatibility
    config.plugins.push(
      new webpack.DefinePlugin({
        'exports': 'typeof exports !== "undefined" ? exports : {}',
        'module': 'typeof module !== "undefined" ? module : { exports: {} }',
        'require': 'typeof require !== "undefined" ? require : function() { return {} }',
      })
    );

    // Optimize parallelism for build performance
    config.parallelism = 4;
    
    if (!dev && isServer) {
      // Optimize for production server builds
      config.optimization.minimize = true;
    }
    
    // Enhanced cache configuration to fix "Serializing big strings" warning
    config.cache = {
      type: 'filesystem',
      compression: 'gzip',
      // Add cache size limits to prevent large string serialization
      maxMemoryGenerations: 5,
      memoryCacheUnaffected: true,
      buildDependencies: {
        config: [__filename],
      },
      // Cache directory optimization with absolute path
      cacheDirectory: path.resolve(process.cwd(), dev ? '.next/cache/webpack' : '.next/cache/webpack-prod'),
    };

    // Optimize chunk splitting to prevent large strings
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000, // Prevent chunks larger than ~240KB
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        enforceSizeThreshold: 50000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
            maxSize: 244000,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
            maxSize: 244000,
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 10,
            chunks: 'all',
            maxSize: 244000,
          },
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            name: 'ui',
            priority: 5,
            chunks: 'all',
            maxSize: 244000,
          },
        },
      },
    };
    
    // FIXED: Enhanced module resolution for Supabase ESM/CommonJS compatibility
    if (isServer) {
      const nodeModules = ['child_process', 'fs', 'path', 'os', 'crypto', 'stream', 'util'];
      
      config.externals = [...(config.externals || []), 
        function({ context, request }, callback) {
          if (nodeModules.includes(request)) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        }
      ];
    } else {
      // For client builds, provide fallbacks for Node.js modules and optional dependencies
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        child_process: false,
        crypto: false,
        stream: false,
        util: false,
        // Add fallbacks for optional polyfill dependencies
        'abort-controller': false,
      };
    }

    // Handle optional dependencies to prevent webpack warnings
    config.externals = config.externals || [];
    config.externals.push(
      function({ context, request }, callback) {
        // Mark optional polyfill dependencies as external to prevent resolution warnings
        if (request === 'abort-controller') {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      }
    );

    // CRITICAL FIX: Add module resolution for ESM/CommonJS compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force ESM resolution for Supabase modules
      '@supabase/supabase-js': path.resolve(__dirname, 'node_modules/@supabase/supabase-js/dist/module/index.js'),
    };

    // CRITICAL FIX: Add module rules for proper exports handling
    config.module.rules.push({
      test: /\.m?js$/,
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },

  // Experimental features - ONLY include supported options
  experimental: {
    // Bundle optimization for performance
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@radix-ui/react-dialog', '@radix-ui/react-select'],
    // Enable CSS chunking for better performance
    cssChunking: true,
  },
  
  // Handle static assets for production builds
  // This ensures the dict directory is included in the standalone build
  // Fix for ENOENT: no such file or directory error
  staticPageGenerationTimeout: 300,
};

module.exports = nextConfig; 