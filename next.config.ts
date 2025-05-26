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
    // Disable CSS-related experimental features that might cause issues
    optimizeCss: false,
    // Enable CSS-in-JS support for better CSS handling
    cssChunking: false,
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
  // Simple CSS handling to avoid entryCSSFiles error
  swcMinify: false,
  // Disable some optimizations that might cause CSS loading issues
  optimizeFonts: false,
  // More robust CSS handling
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    // Handle CSS more gracefully
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Ensure CSS modules work properly
    config.module.rules.push({
      test: /\.css$/,
      use: ['style-loader', 'css-loader'],
    });
    
    return config;
  },
};

export default nextConfig;
