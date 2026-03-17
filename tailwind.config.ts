import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mimi: {
          // 새 색상 시스템: 세련된 톤
          primary: "#B85C38",      // 테라코타 (메인 액센트)
          primaryDark: "#9A4A2A",
          accent: "#5B7A6B",       // 세이지 그린
          gold: "#C9A962",         // 웜 골드
          cream: "#FAF8F5",        // 배경
          charcoal: "#1E2D2D",     // 다크 텍스트
          slate: "#5C6B73",        // 뮤트 텍스트
          // 로고 카드용
          deepPurple: "#4A148C",   // 진보라
          deepRed: "#B71C1C",      // 진빨강
          creamBg: "#FFF8E7",      // 미색
          // 기존 호환
          yellow: "#E8D5B7",
          orange: "#B85C38",
          blue: "#5B7A6B",
          green: "#5B7A6B",
        },
      },
      fontFamily: {
        sans: ["Pretendard", "system-ui", "sans-serif"],
        display: ["Pretendard", "system-ui", "sans-serif"],
        serif: ["Noto Serif KR", "Georgia", "serif"],
        brand: ["Gowun Batang", "Noto Serif KR", "Georgia", "serif"],
        malang: ["HancomMalrangmalrang", "cursive"],
      },
      boxShadow: {
        card: "0 2px 8px -2px rgb(30 45 45 / 0.06), 0 4px 12px -4px rgb(30 45 45 / 0.04)",
        "card-hover": "0 8px 24px -4px rgb(30 45 45 / 0.08), 0 4px 12px -2px rgb(30 45 45 / 0.04)",
        elevated: "0 16px 40px -8px rgb(30 45 45 / 0.12)",
        soft: "0 2px 12px -4px rgb(184 92 56 / 0.15)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
export default config;
