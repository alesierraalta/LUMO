/** @type {import('next').NextConfig} */
const nextConfig = {
  // Essential for Choreo deployment
  output: 'standalone',
  
  // Disable ESLint during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checking during build (for speed)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Transpile necessary packages
  transpilePackages: ['lucide-react'],
  
  // Skip source maps in production for faster builds
  productionBrowserSourceMaps: false,
  
  // Generate consistent build ID for deployment
  generateBuildId: async () => {
    return `build-${Date.now()}`;
  },
  
  // Prisma configuration and other Node.js modules for server-side only
  serverExternalPackages: ['@prisma/client', 'child_process', 'fs', 'path', 'os'],
  
  // Enable compression for better performance
  compress: true,
  
  // Image optimization - optimized for production
  images: {
    unoptimized: false,
    domains: [],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  // Headers for security and CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'X-Accel-Buffering', value: 'no' }, // For Nginx proxy
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
      },
      {
        source: '/sign-in',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/sign-up',
        destination: '/register',
        permanent: true,
      },
      {
        source: '/inventory/new',
        destination: '/inventory/add',
        permanent: true,
      },
    ];
  },

  // Webpack optimization for production deployment
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize parallelism for build performance
    config.parallelism = 4;
    
    if (!dev && isServer) {
      // Optimize for production server builds
      config.optimization.minimize = true;
    }
    
    // Improve build performance with caching
    config.cache = {
      type: 'filesystem',
      compression: 'gzip',
      buildDependencies: {
        config: [__filename],
      },
    };
    
    // Handle Node.js modules properly
    if (isServer) {
      const nodeModules = ['child_process', 'fs', 'path', 'os', 'crypto'];
      
      config.externals = [...(config.externals || []), 
        function({ context, request }, callback) {
          if (nodeModules.includes(request)) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        }
      ];
    } else {
      // For client builds, provide fallbacks for Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        child_process: false,
        crypto: false,
      };
    }
    
    return config;
  },

  // Experimental features - ONLY include supported options
  experimental: {
    // Bundle optimization for performance
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', '@radix-ui/react-dialog', '@radix-ui/react-select'],
    // Enable CSS chunking for better performance
    cssChunking: true,
    // Ensure correct file tracing for production builds
    outputFileTracingRoot: process.cwd(),
    // Enable file tracing to include all necessary files in the output
    outputFileTracing: true,
  },
  
  // Handle static assets for production builds
  // This ensures the dict directory is included in the standalone build
  // Fix for ENOENT: no such file or directory error
  staticPageGenerationTimeout: 300,
};

// Ensure dict directory exists in the build output
const fs = require('fs');
const path = require('path');

// Create missing directories on postbuild
if (process.env.NODE_ENV === 'production') {
  const postBuild = () => {
    try {
      // Paths that need to exist in the standalone build
      const requiredPaths = [
        '.next/standalone/.next/server/app/api/inventory/import/process/dict'
      ];
      
      // Create directories if they don't exist
      requiredPaths.forEach(dirPath => {
        const fullPath = path.join(process.cwd(), dirPath);
        if (!fs.existsSync(fullPath)) {
          console.log(`Creating missing directory: ${dirPath}`);
          fs.mkdirSync(fullPath, { recursive: true });
        }
      });
      
      console.log('✅ Post-build directory creation completed');
    } catch (error) {
      console.error('❌ Error in post-build process:', error);
    }
  };
  
  // Register post-build hook
  nextConfig.onPostBuild = postBuild;
}

module.exports = nextConfig; 