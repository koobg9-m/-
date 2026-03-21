"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

/**
 * 관리자 인증 상태를 확인하고 인증되지 않은 경우 로그인 페이지로 리디렉션합니다.
 * 긴급 수정: 로그인 문제 해결을 위해 단순화된 로직으로 변경
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
    
    // 리디렉션 상태 관리
    const redirectKey = "admin_redirecting";
    const isRedirecting = sessionStorage.getItem(redirectKey);
    
    if (isRedirecting) {
      // 이미 리디렉션 중이면 상태만 업데이트
      setIsChecking(false);
      return;
    }
    
    // API를 통해 인증 상태 확인
    const checkAuthStatus = async () => {
      try {
        // 리디렉션 상태 설정
        sessionStorage.setItem(redirectKey, "true");
        
        const res = await fetch("/api/admin-auth/me", {
          credentials: "include",
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          },
        });
        
        // 리디렉션 상태 초기화
        sessionStorage.removeItem(redirectKey);
        
        if (!res.ok) {
          // API 오류 시 로그인 페이지로 리디렉션
          router.replace("/admin/login");
          return;
        }
        
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
        sessionStorage.removeItem(redirectKey);
        router.replace("/admin/login");
      }
    };
    
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