"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * 관리자 인증 상태를 확인하고 인증되지 않은 경우 로그인 페이지로 리디렉션합니다.
 * 로그인 문제 해결을 위한 수정 버전
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
    
    // 세션 스토리지에서 직접 인증 상태 확인 (클라이언트 측 인증)
    const isAuthenticated = sessionStorage.getItem("mimi_admin_authenticated") === "1";
    
    if (isAuthenticated) {
      // 인증된 경우 컨텐츠 표시
      setIsChecking(false);
    } else {
      // 인증되지 않은 경우 로그인 페이지로 리디렉션
      console.log("관리자 인증 실패, 로그인 페이지로 리디렉션");
      window.location.href = "/admin/login";
    }
  }, [pathname]);
  
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