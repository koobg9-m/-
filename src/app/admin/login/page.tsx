"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { hashPassword, verifyPassword } from "@/lib/auth-utils";
import { setAdminAuthCookie, hasAdminAuthCookie } from "@/lib/admin-auth-cookie";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

const ADMIN_PW_HASH_KEY = "mimi_admin_password_hash";
const ADMIN_AUTH_KEY = "mimi_admin_authenticated";

export default function AdminLoginPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsSetup(!!localStorage.getItem(ADMIN_PW_HASH_KEY));
  }, []);

  // 이미 로그인된 경우(쿠키 있음) /admin으로 리다이렉트
  useEffect(() => {
    if (hasAdminAuthCookie()) {
      window.location.replace("/admin");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setLoading(true);
    try {
      if (isSetup) {
        const hash = localStorage.getItem(ADMIN_PW_HASH_KEY);
        if (!hash) {
          setPasswordError("설정을 찾을 수 없습니다.");
          return;
        }
        const ok = await verifyPassword(passwordInput, hash);
        if (ok) {
          sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
          setAdminAuthCookie();
          window.location.replace("/admin");
        } else {
          setPasswordError("비밀번호가 올바르지 않습니다.");
        }
      } else {
        if (passwordInput.length < 6) {
          setPasswordError("비밀번호는 6자 이상이어야 합니다.");
          return;
        }
        const h = await hashPassword(passwordInput);
        localStorage.setItem(ADMIN_PW_HASH_KEY, h);
        sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
        setAdminAuthCookie();
        window.location.replace("/admin");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="w-full max-w-sm card p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {isSetup ? "관리자 로그인" : "관리자 비밀번호 설정"}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {isSetup ? "비밀번호를 입력하세요." : "최초 1회, 관리자 비밀번호를 설정하세요."}
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }}
              placeholder={isSetup ? "비밀번호" : "6자 이상"}
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
              {loading ? "확인 중..." : isSetup ? "로그인" : "설정 완료"}
            </button>
          </form>
          <p className="mt-4 text-center">
            <a href="/" className="text-sm text-gray-500 hover:underline">← 홈으로</a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
