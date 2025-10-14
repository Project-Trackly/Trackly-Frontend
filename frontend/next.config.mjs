/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  transpilePackages: ["@repo/ui", "@react-three/fiber", "@react-three/drei", "three"],
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL
  },
  // T040: Bundle optimization  
  webpack: (config, { isServer }) => {
    // Configure Three.js module resolution for better compatibility
    if (!isServer) {
      config.resolve.extensionAlias = {
        '.js': ['.js', '.ts', '.tsx'],
        '.mjs': ['.mjs', '.mts'],
      };
      
      // Ensure proper ESM handling for Three.js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
  // Enable bundle analyzer in production build
  // Run: ANALYZE=true pnpm build
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: './analyze.html',
          openAnalyzer: false,
        })
      );
      return config;
    },
  }),
};

export default nextConfig;
