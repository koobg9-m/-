"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

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
    
    // API를 통해 인증 상태 확인
    async function checkAuthStatus() {
      try {
        const res = await fetch("/api/admin-auth/me", {
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
          },
        });
        
        const data = await res.json();
        
        if (!data.ok) {
          // 인증되지 않은 경우 로그인 페이지로 리디렉션
          router.replace("/admin/login");
        } else {
          // 인증된 경우 컨텐츠 표시
          setIsChecking(false);
        }
      } catch (error) {
        console.error("인증 상태 확인 중 오류 발생:", error);
        // 오류 발생 시 로그인 페이지로 리디렉션
        router.replace("/admin/login");
      }
    }
    
    checkAuthStatus();
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