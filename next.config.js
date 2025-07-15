/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  output: 'standalone',
  
  // Image optimization
  images: {
    domains: ['ndprriqyhddjoixrlqnz.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'lucide-react'],
  },
  
  // Bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize for production builds
    if (!dev) {
      config.cache = Object.freeze({
        type: 'memory',
      });
    }
    
    return config;
  },
  
  // Environment-specific configurations
  ...(process.env.NODE_ENV === 'production' && {
    // Production-only settings
    eslint: {
      ignoreDuringBuilds: false, // Keep ESLint checks in production
    },
    typescript: {
      ignoreBuildErrors: false, // Keep TypeScript checks in production
    },
  }),
  
  // Development-only settings
  ...(process.env.NODE_ENV === 'development' && {
    // Enable detailed logging in development
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
  }),
};

module.exports = nextConfig;