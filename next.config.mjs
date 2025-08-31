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
    domains: ['localhost', 'xsgames.co', 'via.placeholder.com'],
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
  transpilePackages: ['framer-motion'],
  experimental: {
    // Disable the export * restriction for client boundaries
    clientComponents: {
      allowExportAll: true,
    },
    // Additional settings for better compatibility
    optimizePackageImports: ['framer-motion'],
    // Enable more permissive module resolution
    esmExternals: 'loose',
  },
};

export default nextConfig;
