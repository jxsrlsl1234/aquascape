import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 配置 API body 大小限制为 100MB
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  // 配置 Turbopack
  turbopack: {},
};

export default nextConfig;
