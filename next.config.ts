import type { NextConfig } from "next";
import type { Configuration as WebpackConfig } from "webpack";

const config: NextConfig = {
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  webpack: (config: WebpackConfig) => {
    if (!config.resolve) {
      config.resolve = {};
    }

    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }

    // Type assertion for the alias object
    (config.resolve.alias as Record<string, string>)['.prisma/client'] = require.resolve('@prisma/client');

    return config;
  },
  transpilePackages: ['@prisma/client'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  turbopack: {
    resolveAlias: {
      '.prisma/client': '@prisma/client'
    }
  }
};

export default config;
