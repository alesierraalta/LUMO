const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Essential optimizations only
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    serverComponentsExternalPackages: ['@prisma/client', '@prisma/engines']
  },
  
  // CRITICAL FIX: Cross-origin requests for Choreo
  allowedDevOrigins: [
    '42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev',
    '*.choreoapps.dev',
    'localhost:3000',
    'localhost:8080'
  ],
  
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

  // Environment detection optimization
  env: {
    FORCE_PRODUCTION: process.env.NODE_ENV === 'production' ? 'true' : 'false'
  }
};

module.exports = nextConfig; 