/** @type {import('next').NextConfig} */

// Development-optimized Next.js configuration
// Reduces compilation time and improves startup performance

const nextConfig = {
  // Disable telemetry for faster startup
  telemetry: false,
  
  // Optimize compilation
  swcMinify: true,
  
  // Reduce compilation overhead
  experimental: {
    // Faster refresh
    optimizePackageImports: ['@supabase/supabase-js'],
    
    // Reduce memory usage
    memoryBasedWorkersCount: true,
    
    // Faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  
  // Optimize images
  images: {
    unoptimized: true, // Faster development builds
  },
  
  // Reduce bundle analysis overhead
  productionBrowserSourceMaps: false,
  
  // Faster compilation for development
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Optimize development builds
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
    
    return config;
  },
  
  // Output configuration
  output: 'standalone',
  
  // Disable source maps in development for faster compilation
  productionBrowserSourceMaps: false,
  
  // Optimize runtime
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
  
  // Environment variables
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
    DISABLE_ESLINT_PLUGIN: 'true',
  },
};

module.exports = nextConfig; 