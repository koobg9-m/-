"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { hashPassword, verifyPassword } from "@/lib/auth-utils";
import { setAdminAuthCookie, hasAdminAuthCookie } from "@/lib/admin-auth-cookie";
import {
  getAdminPasswordHash,
  saveAdminPasswordHash,
  isAdminSetupAllowed,
} from "@/lib/admin-password-hash";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

const ADMIN_AUTH_KEY = "mimi_admin_authenticated";

export default function AdminLoginPage() {
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSetup, setIsSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hashReady, setHashReady] = useState(false);
  const [setupBlocked, setSetupBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const hash = await getAdminPasswordHash();
      if (cancelled) return;
      const hasHash = !!hash;
      setIsSetup(hasHash);
      if (!hasHash && !isAdminSetupAllowed()) {
        setSetupBlocked(true);
      }
      setHashReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 이미 로그인된 경우(쿠키 + 해시 있음) /admin으로
  useEffect(() => {
    if (!hashReady || setupBlocked) return;
    (async () => {
      const hash = await getAdminPasswordHash();
      if (hasAdminAuthCookie() && hash) {
        window.location.replace("/admin");
      }
    })();
  }, [hashReady, setupBlocked]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setLoading(true);
    try {
      const hash = await getAdminPasswordHash();

      if (hash) {
        const ok = await verifyPassword(passwordInput, hash);
        if (ok) {
          sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
          setAdminAuthCookie();
          await saveAdminPasswordHash(hash);
          window.location.replace("/admin");
        } else {
          setPasswordError("비밀번호가 올바르지 않습니다.");
        }
      } else {
        if (!isAdminSetupAllowed()) {
          setPasswordError("최초 설정이 비활성화되어 있습니다.");
          return;
        }
        if (passwordInput.length < 6) {
          setPasswordError("비밀번호는 6자 이상이어야 합니다.");
          return;
        }
        const h = await hashPassword(passwordInput);
        await saveAdminPasswordHash(h);
        sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
        setAdminAuthCookie();
        window.location.replace("/admin");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!hashReady) {
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

  if (setupBlocked) {
    return (
      <div className="min-h-screen flex flex-col bg-mimi-cream">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16 px-4">
          <div className="w-full max-w-md card p-6 text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">관리자 로그인</h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              운영 서버에 관리자 비밀번호가 아직 등록되지 않았습니다. 최초 1회만 Vercel 환경 변수에{" "}
              <code className="bg-stone-100 px-1 rounded text-xs">NEXT_PUBLIC_ALLOW_ADMIN_SETUP=1</code> 을
              넣은 뒤 다시 이 페이지를 열어 비밀번호를 설정하세요. 설정 후에는{" "}
              <code className="bg-stone-100 px-1 rounded text-xs">0</code>으로 바꾸거나 삭제하는 것을 권장합니다.
            </p>
            <a href="/" className="text-sm text-mimi-orange hover:underline">
              ← 홈으로
            </a>
          </div>
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
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError("");
              }}
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
