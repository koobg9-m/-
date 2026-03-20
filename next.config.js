/** @type {import('next').NextConfig} */
const nextConfig = {
  // 배포 시 캐시 무효화 (Vercel은 커밋 SHA 사용)
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`;
  },
  // Windows 파일 잠금·UNKNOWN open 에러 완화 (특히 /admin 등 큰 청크)
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false; // 웹팩 캐시 끔 → .next 청크 잠금/손상 빈도 감소 (빌드는 조금 느려질 수 있음)
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
