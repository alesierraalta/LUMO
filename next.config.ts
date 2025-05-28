import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Enable proper CSS chunking to generate entryCSSFiles
    cssChunking: 'strict',
    // Ensure CSS is properly handled in production
    optimizeCss: {
      // Enable CSS optimization with proper manifest generation
      preload: true,
    },
    // Enable proper server components
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Enable image optimization with proper configuration
  images: {
    domains: [],
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },
  // Optimize compiler settings for CSS handling
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Ensure proper CSS compilation
  transpilePackages: [],
  // Reasonable timeout for build processes
  staticPageGenerationTimeout: 60,
  // Remove trailing slash to prevent path issues
  trailingSlash: false,
  
  // Custom webpack configuration for CSS handling
  webpack: (config, { dev, isServer }) => {
    // Ensure CSS is properly handled
    if (!dev && !isServer) {
      // Configure CSS extraction
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            styles: {
              name: 'styles',
              test: /\.css$/,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Headers to ensure proper CSS loading
  async headers() {
    return [
      {
        source: '/static/css/:path*',
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

export default nextConfig;
