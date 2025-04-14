import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? 'https://s3.ap-northeast-1.amazonaws.com/lolife.murasame-lab.com/' : '';

const nextConfig: NextConfig = {
  output: 'export',
  assetPrefix: basePath, 
};

export default nextConfig;
