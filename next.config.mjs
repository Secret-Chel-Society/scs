// Midnight Studios INTl - All rights reserved
/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['localhost', 'xsgames.co', 'via.placeholder.com'],
    unoptimized: true,
  },
  // Configure path aliases
  webpack: (config, { isServer }) => {
    // Add path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
    };

    // Fix for @supabase/node-fetch issue
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        'node-fetch': false,
        '@supabase/node-fetch': false,
      };
    }
    
    return config;
  },
  // Configure rewrites
  async rewrites() {
    return [
      {
        source: '/@:path*',
        destination: '/:path*',
      },
    ];
  },
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  async headers() {
    return [
      {
        source: '/ads.txt',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // Fix for @supabase/node-fetch issue
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        "node-fetch": false,
        "@supabase/node-fetch": false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
