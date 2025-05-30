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
  
  // Prisma configuration
  serverExternalPackages: ['@prisma/client'],
  
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
    
    // Handle prisma binary
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    return config;
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

module.exports = nextConfig; 