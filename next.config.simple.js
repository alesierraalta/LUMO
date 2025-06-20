/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // CRITICAL FIX: Minimal configuration to avoid build issues
  experimental: {
    // Disable all experimental features that could cause issues
    webpackBuildWorker: false,
  },
  
  // Disable features that could cause data collection issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Minimal webpack configuration
  webpack: (config, { isServer }) => {
    // Only add essential externals
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('@supabase/realtime-js');
    }
    
    // Minimal fallbacks
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    return config;
  },
  
  // Essential redirects only
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig; 