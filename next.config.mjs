// Midnight Studios INTl - All rights reserved
/** @type {import('next').NextConfig} */

// Common domains that might be used
const allowedDomains = [
  'localhost', 
  'xsgames.co', 
  'via.placeholder.com',
  'www.secretchelsociety.com', // Your production domain
  'secretchelsociety.com', // Your production domain without www
  'kudmtqjzuxakngbrqxzp.supabase.co', // Your specific Supabase domain from the error
  'supabase.co',
  'supabase.com'
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: allowedDomains,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.com',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'supabase.com',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'www.secretchelsociety.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'secretchelsociety.com',
        port: '',
        pathname: '/**',
      }
    ],
    unoptimized: true,
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
