import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */

const isMobileBuild = process.env.BUILD_TARGET === 'mobile';

const nextConfig = {
  productionBrowserSourceMaps: true,

  distDir: process.env.DIST_DIR || '.next',

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  images: isMobileBuild
    ? {
        unoptimized: true,
      }
    : {
        remotePatterns: imageHosts,
        minimumCacheTTL: 60,
        qualities: [75, 85, 100],
      },

  ...(isMobileBuild
    ? {
        output: 'export',
        trailingSlash: true,
      }
    : {}),

  webpack(config, { dev }) {
    config.module.rules.push({
      test: /\.(jsx|tsx)$/,
      exclude: [/node_modules/],
      use: [
        {
          loader: '@dhiwise/component-tagger/nextLoader',
        },
      ],
    });

    if (dev) {
      const ignoredPaths = (process.env.WATCH_IGNORED_PATHS || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      config.watchOptions = {
        ignored: ignoredPaths.length
          ? ignoredPaths.map((p) => `**/${p.replace(/^\/+|\/+$/g, '')}/**`)
          : undefined,
      };
    }

    return config;
  },
};

export default nextConfig;