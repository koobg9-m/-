"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const ADMIN_AUTH_KEY = "mimi_admin_authenticated";

/**
 * 관리자 인증 상태를 확인하고 인증되지 않은 경우 로그인 페이지로 리디렉션합니다.
 * 강화된 인증 체크 버전
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
    
    const checkAuth = async () => {
      try {
        // 1. 세션 스토리지에서 직접 인증 상태 확인 (클라이언트 측 인증)
        const isAuthenticated = sessionStorage.getItem(ADMIN_AUTH_KEY) === "1";
        
        if (isAuthenticated) {
          // 인증된 경우 컨텐츠 표시
          setIsChecking(false);
          return;
        }
        
        // 2. 서버 API를 통한 인증 확인 (백업 체크)
        try {
          const response = await fetch("/api/admin-auth/me", { 
            credentials: "include",
            headers: {
              "Cache-Control": "no-cache",
              "Pragma": "no-cache"
            }
          });
          const data = await response.json();
          
          if (data?.ok) {
            // 서버 인증이 유효하면 세션 스토리지에 저장하고 컨텐츠 표시
            sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
            setIsChecking(false);
            return;
          }
        } catch (error) {
          console.error("서버 인증 확인 중 오류:", error);
        }
        
        // 인증되지 않은 경우 로그인 페이지로 리디렉션
        console.log("관리자 인증 실패, 로그인 페이지로 리디렉션");
        window.location.href = "/admin/login";
      } catch (error) {
        console.error("인증 확인 중 오류:", error);
        // 오류 발생 시 안전하게 로그인 페이지로 리디렉션
        window.location.href = "/admin/login";
      }
    };
    
    checkAuth();
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