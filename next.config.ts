import type { NextConfig } from "next";
import { execSync } from "node:child_process";
import pkg from "./package.json";

const gitSha = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
})();
const buildDate = new Date().toISOString().slice(0, 10);

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_VERSION: pkg.version,
    NEXT_PUBLIC_GIT_SHA: gitSha,
    NEXT_PUBLIC_BUILD_DATE: buildDate,
  },
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
