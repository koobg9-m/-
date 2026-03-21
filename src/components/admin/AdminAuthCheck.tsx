"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { clearAdminAuthCookie } from "@/lib/admin-auth-cookie";

/**
 * 관리자 인증 상태를 확인하고 인증되지 않은 경우 로그인 페이지로 리디렉션합니다.
 * /admin/login 페이지는 제외합니다.
 */
export default function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    // 로그인 페이지는 검사하지 않음
    if (pathname === "/admin/login") {
      setIsChecking(false);
      return;
    }
    
    // 항상 인증되지 않은 것으로 처리하여 로그인 페이지로 리디렉션
    clearAdminAuthCookie();
    sessionStorage.removeItem("mimi_admin_authenticated");
    localStorage.removeItem("mimi_admin_authenticated");
    router.replace("/admin/login");
  }, [pathname, router]);
  
  // 인증 확인 중이면 로딩 표시
  if (isChecking && pathname !== "/admin/login") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mimi-cream">
        <p className="text-gray-600">인증 확인 중...</p>
      </div>
    );
  }
  
  return <>{children}</>;
}