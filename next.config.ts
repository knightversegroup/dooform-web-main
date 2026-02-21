import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "profile.line-scdn.net",
      },
      {
        protocol: "https",
        hostname: "sprofile.line-scdn.net",
      },
      {
        protocol: "https",
        hostname: "obs.line-scdn.net",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/forms",
        destination: "/templates",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
