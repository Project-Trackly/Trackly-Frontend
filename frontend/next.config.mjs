/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  transpilePackages: ["@repo/ui"],
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL
  },
  // T040: Bundle optimization
  webpack: (config, { isServer }) => {
    // Optimize Three.js bundle size
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Use ES modules version of Three.js for better tree-shaking
        'three': 'three/build/three.module.js',
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
