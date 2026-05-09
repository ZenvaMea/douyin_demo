import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  // ffmpeg-static 内置二进制，必须排除出 bundler，否则路径会被改写为 /ROOT/...
  serverExternalPackages: ['ffmpeg-static', 'fluent-ffmpeg'],
};

export default nextConfig;
