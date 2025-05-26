/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false, // Disable strict mode to avoid double-rendering issues
  serverExternalPackages: ['@prisma/client', 'prisma'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  // Enhanced configuration for CSS and static files in standalone mode
  images: {
    domains: [],
    unoptimized: true, // Disable image optimization for standalone builds
  },
  // Ensure proper CSS handling in standalone mode
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },
  // Better handling of static files in standalone builds
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
};

export default nextConfig;
