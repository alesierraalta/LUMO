/** @type {import('next').NextConfig} */
const path = require('path');

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

  // Transpile necessary packages
  transpilePackages: ['lucide-react'],
  
  // Skip source maps in production for faster builds
  productionBrowserSourceMaps: false,
  
  // Generate consistent build ID for deployment
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  
  // Prisma configuration and other Node.js modules for server-side only
  serverExternalPackages: ['child_process', 'fs', 'path', 'os'],
  
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
    
    // Handle Node.js modules properly
    if (isServer) {
      const nodeModules = ['child_process', 'fs', 'path', 'os', 'crypto'];
      
      config.externals = [...(config.externals || []), 
        function({ context, request }, callback) {
          if (nodeModules.includes(request)) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        }
      ];
    } else {
      // For client builds, provide fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        child_process: false,
        crypto: false,
      };
    }
    
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