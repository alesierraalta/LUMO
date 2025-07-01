const path = require('path');

// CRITICAL FIX: Remove supabase-polyfill require that causes production issues
// require('./src/lib/supabase-polyfill.js'); // REMOVED - causing critical dependency warnings

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ultra-fast dev optimizations
  experimental: {
    turbo: {
      resolveAlias: {
        // Reduce module resolution time
        '@': './src',
      },
    },
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Faster builds
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Reduce bundle size
  output: 'standalone',
  
  // Faster dev server
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Optimize images
  images: {
    unoptimized: true, // Faster dev builds
  },
  
  // Disable telemetry for faster startup
  telemetry: false,
  
  // TypeScript optimization
  typescript: {
    tsconfigPath: './tsconfig.json',
    ignoreBuildErrors: false,
  },
  
  // Webpack optimizations for dev
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Faster dev builds
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          common: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true
          }
        }
      };
      
      // Reduce module resolution time
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname, 'src'),
      };
    }
    
    return config;
  },
  
  // Reduce logging
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  
  // Headers for better caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 