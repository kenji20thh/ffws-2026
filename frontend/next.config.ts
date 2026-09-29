import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "webid.cdn.garenanow.com" },
    ],
  },
};

export default nextConfig;