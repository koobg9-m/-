"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

const ADMIN_AUTH_KEY = "mimi_admin_authenticated";

/**
 * 관리자 로그인 페이지
 * 로그인 문제 해결을 위한 수정 버전
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  /** 쿠키까지 확인한 뒤에만 /admin 으로 보냄 — sessionStorage만 믿고 리다이렉트하면 깜빡임·루프 발생 */
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (typeof window === "undefined") return;
      if (sessionStorage.getItem(ADMIN_AUTH_KEY) !== "1") return;

      setRedirecting(true);
      try {
        const res = await fetch("/api/admin-auth/me", {
          credentials: "include",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data?.ok) {
          router.replace("/admin");
          return;
        }
        sessionStorage.removeItem(ADMIN_AUTH_KEY);
      } catch {
        if (!cancelled) sessionStorage.removeItem(ADMIN_AUTH_KEY);
      } finally {
        if (!cancelled) setRedirecting(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // 로그인 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setLoading(true);
    
    try {
      // 인증은 서버(API + 쿠키)만 사용. 화면/저장소에 비밀번호 목록을 두지 않음.
      const res = await fetch("/api/admin-auth/login", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Pragma": "no-cache"
        },
        credentials: "include",
        body: JSON.stringify({ password: passwordInput }),
      });
      
      // 응답 처리
      const data = await res.json().catch(() => ({}));
      
      if (res.ok) {
        sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
        router.replace("/admin");
        return;
      }
      
      // 로그인 실패 (401 비밀번호 불일치 / 503 서버에 ADMIN_PASSWORD 없음 등)
      setPasswordError(
        typeof data.error === "string" ? data.error : "비밀번호가 올바르지 않습니다."
      );
    } catch (error) {
      console.error("로그인 처리 중 오류 발생:", error);
      setPasswordError("로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (redirecting) {
    return (
      <div className="min-h-screen flex flex-col bg-mimi-cream">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <p className="text-gray-500">관리자 페이지로 이동 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="w-full max-w-sm card p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">관리자 로그인</h2>
          <p className="text-sm text-gray-600 mb-4">비밀번호를 입력하세요.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError("");
              }}
              placeholder="비밀번호"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
              autoFocus
              disabled={loading}
            />
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-mimi-orange text-white rounded-xl font-bold disabled:opacity-60"
            >
              {loading ? "확인 중..." : "로그인"}
            </button>
          </form>
          <p className="mt-4 text-center">
            <a href="/" className="text-sm text-gray-500 hover:underline">
              ← 홈으로
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}