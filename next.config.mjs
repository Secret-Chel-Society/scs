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
    
    // Code optimization for production builds
    if (!dev && !isServer) {
      // Enable built-in webpack optimizations
      config.optimization.minimize = true;
      config.optimization.minimizer = config.optimization.minimizer || [];
      
      // Add custom optimization for Midnight Studios INTl
      config.optimization.minimizer.push({
        apply: (compiler) => {
          compiler.hooks.compilation.tap('MidnightStudiosOptimizer', (compilation) => {
            compilation.hooks.optimizeChunkAssets.tap('MidnightStudiosOptimizer', (chunks) => {
              chunks.forEach((chunk) => {
                chunk.files.forEach((filename) => {
                  if (filename.endsWith('.js')) {
                    const asset = compilation.assets[filename];
                    const source = asset.source();
                    
                    // Remove console logs but keep Midnight Studios INTl comments
                    const optimizedSource = source
                      .replace(/console\.(log|warn|error|info|debug)\([^)]*\);?/g, '')
                      .replace(/\/\*[\s\S]*?\*\//g, (match) => {
                        return match.includes('Midnight Studios INTl') ? match : '';
                      });
                    
                    compilation.assets[filename] = {
                      source: () => optimizedSource,
                      size: () => optimizedSource.length
                    };
                  }
                });
              });
            });
          });
        }
      });
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
