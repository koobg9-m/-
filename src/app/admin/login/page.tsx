"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { hashPassword, verifyPassword } from "@/lib/auth-utils";
import { setAdminAuthCookie, hasAdminAuthCookie, clearAdminAuthCookie } from "@/lib/admin-auth-cookie";
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
  const [authConfig, setAuthConfig] = useState<{
    envPasswordAuth?: boolean;
    hasPasswordHashInDb?: boolean;
  }>({});

  const isProduction = process.env.NODE_ENV === "production";

  // 페이지 로드 시 강제 로그아웃
  useEffect(() => {
    // 브라우저 쿠키 및 세션 스토리지 삭제
    clearAdminAuthCookie();
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    localStorage.removeItem("mimi_admin_authenticated");
    
    // 다른 초기화 코드
    let cancelled = false;
    (async () => {
      let cfg: { envPasswordAuth?: boolean; hasPasswordHashInDb?: boolean } = {};
      try {
        cfg = await fetch("/api/admin-auth/config", { credentials: "include" }).then((r) => r.json());
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      setAuthConfig(cfg);

      const hash = await getAdminPasswordHash();
      if (cancelled) return;
      const hasHash = !!hash;
      setIsSetup(hasHash);

      /** Vercel ADMIN_PASSWORD / Supabase 해시 / 로컬 해시 / 최초설정 허용 중 하나라도 있으면 폼 표시 */
      const allowLogin =
        hasHash ||
        !!cfg.hasPasswordHashInDb ||
        !!cfg.envPasswordAuth ||
        isAdminSetupAllowed();

      if (!allowLogin) {
        setSetupBlocked(true);
      }
      setHashReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 자동 리디렉션 코드 제거 - 항상 로그인 화면 표시

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setLoading(true);
    try {
      // 운영: Supabase에 동기화된 해시만 서버에서 검증 (로컬에서 부여한 비밀번호와 동일)
      if (isProduction) {
        const res = await fetch("/api/admin-auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ password: passwordInput }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
          setAdminAuthCookie();
          window.location.replace("/admin");
          return;
        }
        setPasswordError(typeof data.error === "string" ? data.error : "로그인에 실패했습니다.");
        return;
      }

      // 개발: 기존 — 클라이언트 해시 + 최초 설정
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
              관리자 로그인 방법이 아직 없습니다. <strong>Vercel</strong> → Environment Variables 에{" "}
              <code className="bg-stone-100 px-1 rounded text-xs">ADMIN_PASSWORD</code> 를 추가하고 재배포하거나,{" "}
              <strong>PC(로컬)</strong>에서 <code className="bg-stone-100 px-1 rounded text-xs">npm run dev</code> 후{" "}
              <code className="bg-stone-100 px-1 rounded text-xs">/admin/login</code> 에서 비밀번호를 설정해 Supabase에
              올리세요. (또는 <code className="bg-stone-100 px-1 rounded text-xs">NEXT_PUBLIC_ALLOW_ADMIN_SETUP=1</code> 로
              운영에서 최초 설정)
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

  const title = isSetup || isProduction ? "관리자 로그인" : "관리자 비밀번호 설정";
  const subtitle = isProduction
    ? authConfig.envPasswordAuth
      ? "Vercel에 설정한 ADMIN_PASSWORD 또는 로컬에서 등록한 비밀번호를 입력하세요."
      : "로컬에서 등록한 관리자 비밀번호를 입력하세요 (Supabase에 동기화된 경우)."
    : isSetup
      ? "비밀번호를 입력하세요."
      : "최초 1회, 관리자 비밀번호를 설정하세요.";

  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="w-full max-w-sm card p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-sm text-gray-600 mb-4">{subtitle}</p>
          {isProduction && (
            <p className="text-xs text-stone-500 mb-3 leading-relaxed">
              운영에서는 <code className="text-[11px] bg-stone-100 px-1 rounded">ADMIN_PASSWORD</code>(Vercel) 또는
              Supabase에 동기화된 비밀번호 중 하나로 로그인됩니다.
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError("");
              }}
              placeholder={isProduction || isSetup ? "비밀번호" : "6자 이상"}
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
              {loading ? "확인 중..." : isProduction || isSetup ? "로그인" : "설정 완료"}
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