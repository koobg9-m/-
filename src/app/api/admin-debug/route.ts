/**
 * 관리자 로그인 디버깅용 API — 로컬 개발에서만 동작 (운영 노출 방지)
 */
import { NextResponse } from "next/server";
import { isSupabaseConfiguredServer } from "@/lib/supabase/admin";
import { getAdminPasswordHashFromDatabase } from "@/lib/admin-auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // 환경 변수 확인 (비밀번호 값·길이는 노출하지 않음)
  const hasEnvPassword = !!(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0);
  
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
    supabaseConfigured,
    hasStoredHash: !!storedHash,
    hashError,
    allowAdminSetup,
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0"
    }
  });
}