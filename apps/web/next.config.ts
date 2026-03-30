import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@shogun/shared", "@shogun/db", "@shogun/ui"],

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "*.supabase.in" },
    ],
  },

  // Performance
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
};

export default nextConfig;
