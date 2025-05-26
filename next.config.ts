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
    // Disable CSS-related experimental features that might cause issues
    optimizeCss: false,
  },
  // Disable image optimization and use conservative settings
  images: {
    domains: [],
    unoptimized: true,
  },
  // Conservative compiler settings to avoid CSS manifest issues
  compiler: {
    removeConsole: false, // Keep console logs for debugging
  },

};

export default nextConfig;
