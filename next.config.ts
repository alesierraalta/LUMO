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
    // Completely disable CSS optimization to avoid manifest issues
    optimizeCss: false,
    // Disable other experimental features that might interfere
    forceSwcTransforms: false,
    // Disable CSS chunking completely
    optimizePackageImports: [],
    // Add these options to prevent missing CSS manifest issues
    serverMinification: false,
    bundlePagesExternals: false,
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
  // Simplify CSS handling completely
  transpilePackages: ['@tailwindcss/postcss'],
  // Enable memory cache to prevent rebuilding CSS manifest files
  staticPageGenerationTimeout: 120,
  // Add trailing slash to prevent CSS path issues
  trailingSlash: true,
  // Force static optimization off to use more consistent server-side rendering
  staticOptimization: false,
};

export default nextConfig;
