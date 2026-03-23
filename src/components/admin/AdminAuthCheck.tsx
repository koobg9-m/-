"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const ADMIN_AUTH_KEY = "mimi_admin_authenticated";

/**
 * /admin/* 인증 (쿠키 + sessionStorage 보조)
 * - /admin/login 은 검사하지 않음 (깜빡임·전체 새로고침 루프 방지)
 * - pathname 전환 시마다 다시 검사 (로그인 → /admin 이동 포함)
 */
export default function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(() => pathname !== "/admin/login");

  useEffect(() => {
    if (pathname === "/admin/login") {
      setIsChecking(false);
      return;
    }

    let cancelled = false;

    const checkAuth = async () => {
      setIsChecking(true);
      try {
        const isAuthenticated = sessionStorage.getItem(ADMIN_AUTH_KEY) === "1";
        if (isAuthenticated) {
          return;
        }

        const response = await fetch("/api/admin-auth/me", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });
        const data = await response.json();

        if (cancelled) return;

        if (data?.ok) {
          sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
          return;
        }

        sessionStorage.removeItem(ADMIN_AUTH_KEY);
        router.replace("/admin/login");
      } catch {
        if (!cancelled) {
          router.replace("/admin/login");
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (isChecking && pathname !== "/admin/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mimi-cream">
        <p className="text-gray-600">인증 확인 중...</p>
      </div>
    );
  }

  return <>{children}</>;
}
