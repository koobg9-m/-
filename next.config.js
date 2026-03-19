/** @type {import('next').NextConfig} */
const nextConfig = {
  // 배포 시 캐시 무효화 (Vercel은 커밋 SHA 사용)
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`;
  },
  // Windows 파일 잠금 완화
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 3000, // 3000ms = 3초 (파일 감시 간격, 포트 아님)
        aggregateTimeout: 600,
        ignored: /node_modules/,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
