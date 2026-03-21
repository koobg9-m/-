/**
 * 관리자 로그인 디버깅용 API
 * 주의: 이 API는 개발 용도로만 사용하고 프로덕션에서는 제거해야 합니다.
 */
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfiguredServer } from "@/lib/supabase/admin";
import { getAdminPasswordHashFromDatabase } from "@/lib/admin-auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  // 환경 변수 확인
  const hasEnvPassword = !!(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0);
  const envPasswordLength = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0;
  
  // Supabase 설정 확인
  const supabaseConfigured = isSupabaseConfiguredServer();
  
  // 데이터베이스에 저장된 비밀번호 해시 확인
  let storedHash = null;
  let hashError = null;
  
  if (supabaseConfigured) {
    try {
      storedHash = await getAdminPasswordHashFromDatabase();
    } catch (error) {
      hashError = error instanceof Error ? error.message : String(error);
    }
  }
  
  // 관리자 설정 허용 여부
  const allowAdminSetup = process.env.NEXT_PUBLIC_ALLOW_ADMIN_SETUP === "1" || 
                         process.env.NEXT_PUBLIC_ALLOW_ADMIN_SETUP === "true";
  
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasEnvPassword,
    envPasswordLength,
    supabaseConfigured,
    hasStoredHash: !!storedHash,
    hashError,
    allowAdminSetup,
    timestamp: new Date().toISOString()
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}