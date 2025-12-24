import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // TMDB画像の最適化を有効化
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        pathname: '/t/p/**',
      },
    ],
  },
};

export default nextConfig;
