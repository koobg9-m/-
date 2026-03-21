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
    
    // 로그인 페이지로 한 번만 리디렉션
    // localStorage에 리디렉션 상태를 저장하여 무한 루프 방지
    const redirectKey = "admin_redirecting";
    const isRedirecting = localStorage.getItem(redirectKey);
    
    if (!isRedirecting) {
      localStorage.setItem(redirectKey, "true");
      
      // 약간의 지연 후 리디렉션 (상태 안정화를 위해)
      setTimeout(() => {
        router.push("/admin/login");
      }, 100);
      
      // 리디렉션 상태 초기화 (5초 후)
      setTimeout(() => {
        localStorage.removeItem(redirectKey);
      }, 5000);
    } else {
      // 이미 리디렉션 중이면 상태만 업데이트
      setIsChecking(false);
    }
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