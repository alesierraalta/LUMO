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
  
  // Prisma configuration and other Node.js modules for server-side only
  serverExternalPackages: ['@prisma/client', 'child_process', 'fs', 'path', 'os'],
  
  // Enable compression for better performance
  compress: true,
  
  // Optimize for production
  productionBrowserSourceMaps: false,
  
  // Image optimization
  images: {
    unoptimized: true,
    domains: [],
    formats: ['image/webp'],
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: 'my-value',
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
    ];
  },

  // Webpack optimization for Choreo
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && isServer) {
      // Optimize for production server builds
      config.optimization.minimize = true;
    }
    
    // Properly handle Node.js modules
    if (isServer) {
      // Mark certain Node.js modules as external for server
      const nodeModules = ['child_process', 'fs', 'path', 'os', 'crypto'];
      
      // Don't bundle Node.js native modules for server builds
      config.externals = [...(config.externals || []), 
        function({ context, request }, callback) {
          if (nodeModules.includes(request)) {
            // Mark as external to prevent bundling
            return callback(null, `commonjs ${request}`);
          }
          callback();
        }
      ];
    } else {
      // For client builds, handle modules that might be referenced
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

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

module.exports = nextConfig; 