import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@shogun/shared", "@shogun/db", "@shogun/ui"],
};

export default nextConfig;
