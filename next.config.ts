import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fail production builds on ESLint errors (including react-hooks/rules-of-hooks).
  // This catches the class of bug that crashed the site with React error #310.
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ["src"],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'live.staticflickr.com',
      },
      {
        protocol: 'https',
        hostname: 'iiif.wellcomecollection.org',
      },
    ],
  },
};

export default nextConfig;
