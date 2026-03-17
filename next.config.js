/** @type {import('next').NextConfig} */
const nextConfig = {
  // Windows 파일 잠금 완화
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 3000,
        aggregateTimeout: 600,
        ignored: /node_modules/,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
