const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Essential optimizations only
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Turbopack (stable now)
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },
  
  // Build optimizations
  output: 'standalone',
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Fast dev server
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Images optimization
  images: {
    unoptimized: true,
  },
  
  // TypeScript optimization
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Webpack optimization - CRITICAL: Always configure alias
  webpack: (config, { dev }) => {
    // ALWAYS set alias for both dev and production
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    
    // Fallbacks for missing modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'webworker-threads': false,
    };
    
    return config;
  },
};

module.exports = nextConfig; 