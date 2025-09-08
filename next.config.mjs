// Midnight Studios INTl - All rights reserved
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
  webpack: (config, { isServer, dev }) => {
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
    
    // Code obfuscation for production builds
    if (!dev && !isServer) {
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            mangle: {
              // Obfuscate variable names
              reserved: ['Midnight Studios INTl', 'createClient', 'supabase']
            },
            compress: {
              // Remove console logs in production
              drop_console: true,
              drop_debugger: true,
            },
            format: {
              // Remove comments except our studio name
              comments: /Midnight Studios INTl/i,
            },
          },
          extractComments: false,
        }),
      ];
    }

    // Add source map tracking
    if (!dev) {
      config.devtool = 'source-map';
      
      // Custom source map plugin to track downloads
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.emit.tapAsync('SourceMapTracker', (compilation, callback) => {
            // Add tracking to source maps
            Object.keys(compilation.assets).forEach(filename => {
              if (filename.endsWith('.map')) {
                const asset = compilation.assets[filename];
                const source = asset.source();
                const trackedSource = `// Midnight Studios INTl - Source Map Access Tracked\n${source}`;
                compilation.assets[filename] = {
                  source: () => trackedSource,
                  size: () => trackedSource.length
                };
              }
            });
            callback();
          });
        }
      });
    }
    
    return config;
  },
};

export default nextConfig;
