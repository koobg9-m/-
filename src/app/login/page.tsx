import type { Metadata } from "next";
import LoginForm from "@/components/auth/LoginForm";

/** 서버 메타데이터(검색·미리보기) — 휴대폰 SMS 로그인 미사용을 명시 */
export const metadata: Metadata = {
  title: "로그인 | 미미살롱펫",
  description: "카카오톡 또는 이메일(매직 링크)로 로그인합니다. 휴대폰 SMS 인증 로그인은 사용하지 않습니다.",
  openGraph: {
    title: "로그인 | 미미살롱펫",
    description: "카카오톡 또는 이메일로 로그인",
  },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 via-mimi-cream to-amber-50/30 flex flex-col items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24">
      <LoginForm />
    </div>
  );
}
