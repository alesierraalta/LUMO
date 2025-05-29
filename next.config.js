/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    cssChunking: 'strict',
  },
  // Configure webpack to handle the logger modules properly
  webpack: (config, { isServer, buildId }) => {
    // Handle logger modules for different runtimes
    if (isServer) {
      config.externals = [...(config.externals || []), 'fs', 'path'];
    }
    
    return config;
  },
  // Configure serverComponentsExternalPackages for Prisma and logger
  serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  
  // Environment variables to be embedded in the client
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
  
  // Output configuration
  output: 'standalone',
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  
  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig; 