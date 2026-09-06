import type { NextConfig } from 'next';

const isStaticExport = process.env.NEXT_PUBLIC_IS_STATIC_EXPORT === 'true' || Boolean(process.env.CI);

// Automatically detect GitHub Pages repository subpath (e.g. /library)
const repoName = process.env.GITHUB_REPOSITORY
  ? process.env.GITHUB_REPOSITORY.split('/')[1]
  : '';
const isUserOrgPage = repoName.toLowerCase().endsWith('.github.io');
const basePath =
  process.env.NEXT_PUBLIC_BASE_PATH ||
  (process.env.CI && repoName && !isUserOrgPage ? `/${repoName}` : '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  output: isStaticExport ? 'export' : 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, { dev }) => {
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
