"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

const ADMIN_AUTH_KEY = "mimi_admin_authenticated";

/**
 * 관리자 로그인 페이지
 * 긴급 수정: 로그인 문제 해결을 위해 단순화된 로직으로 변경
 */
export default function AdminLoginPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // 페이지 로드 시 초기화
  useEffect(() => {
    // 리디렉션 상태 초기화
    sessionStorage.removeItem("admin_redirecting");
    setIsReady(true);
    
    // 이미 인증된 경우 자동 리디렉션
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin-auth/me", {
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            window.location.replace("/admin");
          }
        }
      } catch (error) {
        console.error("인증 상태 확인 중 오류 발생:", error);
      }
    };
    
    checkAuth();
  }, []);

  // 로그인 폼 제출 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setLoading(true);
    
    try {
      // 비밀번호 검증 API 호출
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
        // 로그인 성공
        sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
        window.location.replace("/admin");
        return;
      }
      
      // 로그인 실패
      setPasswordError(typeof data.error === "string" ? data.error : "로그인에 실패했습니다.");
    } catch (error) {
      console.error("로그인 처리 중 오류 발생:", error);
      setPasswordError("로그인 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col bg-mimi-cream">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <p className="text-gray-500">불러오는 중...</p>
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
          <p className="text-sm text-gray-600 mb-4">관리자 비밀번호를 입력하세요.</p>
          
          <div className="text-xs text-amber-600 mb-3 p-2 bg-amber-50 rounded-lg">
            <p className="font-medium">사용 가능한 비밀번호:</p>
            <p>미미살롱2024, mimi2024, admin2024</p>
          </div>
          
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