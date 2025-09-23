// Midnight Studios INTl - All rights reserved
/** @type {import('next').NextConfig} */

// Extract Supabase domain from environment variable
const getSupabaseDomain = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null
  
  try {
    const url = new URL(supabaseUrl)
    return url.hostname
  } catch {
    return null
  }
}

const supabaseDomain = getSupabaseDomain()

// Debug logging for Supabase domain
if (supabaseDomain) {
  console.log('🔧 Next.js Config: Supabase domain detected:', supabaseDomain)
} else {
  console.log('⚠️ Next.js Config: No Supabase domain found in NEXT_PUBLIC_SUPABASE_URL')
}

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
    domains: [
      'localhost', 
      'xsgames.co', 
      'via.placeholder.com',
      // Add the actual Supabase domain from environment
      ...(supabaseDomain ? [supabaseDomain] : [])
    ],
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
