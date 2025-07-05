import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compiler: {
    styledComponents: {
      displayName: true,
      ssr: true,
      fileName: false,
      topLevelImportPaths: [],
      meaninglessFileNames: ["index", "styles"],
    },
  },
  // Transpile styled-components and react-pdf
  transpilePackages: ['styled-components'],
  // Disable React strict mode for now to troubleshoot issues
  reactStrictMode: false,
  // Disable ESLint checks during build for faster builds
  // This is only for production builds - development still uses ESLint
  eslint: {
    // Only ignore ESLint errors during production builds
    ignoreDuringBuilds: process.env.NODE_ENV === 'production',
  },
  // Add experimental optimizations to help with module resolution
  experimental: {
    optimizePackageImports: ['styled-components', 'react-icons', 'framer-motion', '@supabase/supabase-js', '@supabase/auth-helpers-nextjs'],
    webpackBuildWorker: true, // Use worker for webpack builds
    // Configure larger body size limit for file uploads (50MB)
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  
  // Optimize production builds
  compress: true,
  poweredByHeader: false,
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'geafwqcjiopeinpqykpk.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // Configure webpack for react-pdf (client-side PDF viewing)
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    // Configure PDF.js worker handling for react-pdf
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]',
      },
    });

    return config;
  },
  
  // Add headers for better PDF handling
  async headers() {
    return [
      // Cache static assets aggressively
      {
        source: '/:all*(js|css|jpg|jpeg|png|gif|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache Next.js static files
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes - no cache by default
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/pdf-worker/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/pdf-proxy',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET',
          },
        ],
      },
    ];
  },
};

export default nextConfig;