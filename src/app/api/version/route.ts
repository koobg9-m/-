/**
 * 배포 버전 확인용 API
 * https://mimisalon.vercel.app/api/version 접속 시 현재 배포 버전·관리자 설정 여부 확인(비밀번호 값은 절대 노출 안 함)
 */
import { NextResponse } from "next/server";
import { SITE_VERSION } from "@/lib/site-version";
import { isSupabaseConfiguredServer } from "@/lib/supabase/admin";
import { getAdminPasswordHashFromDatabase } from "@/lib/admin-auth-server";

const DEPLOY_TIME = "2026-03-20";

/** 고객용 /login UI — 앱에서 사용하는 방식만 (Supabase Phone Provider와 무관) */
const CUSTOMER_LOGIN_METHODS = ["kakao", "email"] as const;

function isAdminDisabledInProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    (process.env.NEXT_PUBLIC_DISABLE_ADMIN === "1" || process.env.NEXT_PUBLIC_DISABLE_ADMIN === "true")
  );
}

export async function GET() {
  const adminPanelBlocked = isAdminDisabledInProduction();
  const supabaseOk = isSupabaseConfiguredServer();
  let adminPasswordHashInDatabase = false;
  if (supabaseOk) {
    try {
      const h = await getAdminPasswordHashFromDatabase();
      adminPasswordHashInDatabase = !!(h && h.length > 0);
    } catch {
      adminPasswordHashInDatabase = false;
    }
  }
  const adminEnvPasswordSet = !!(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0);

  const res = NextResponse.json({
    version: SITE_VERSION,
    deployTime: DEPLOY_TIME,
    timestamp: new Date().toISOString(),
    /** 고객 로그인: 카카오 + 이메일 매직링크만 (휴대폰 SMS OTP 미사용) */
    customerLoginMethods: [...CUSTOMER_LOGIN_METHODS],
    customerPhoneOtpLogin: false,
    /**
     * true면 프로덕션 빌드에서 NEXT_PUBLIC_DISABLE_ADMIN 로 /admin 전체가 막힌 상태.
     * Vercel에서 해당 변수를 삭제·끄고 재배포하면 false로 바뀜.
     */
    adminPanelBlocked,
    /** 서버에서 Supabase env(URL+anon)가 잡혀 있는지 */
    supabaseConfigured: supabaseOk,
    /** Vercel에 ADMIN_PASSWORD 가 설정돼 있는지(값 자체는 노출 안 함) */
    adminEnvPasswordSet,
    /** Supabase app_data 에 관리자 비밀번호 해시(mimi_admin_password_hash)가 있는지 */
    adminPasswordHashInDatabase,
    /**
     * 관리자 로그인 가능 여부 요약: 둘 중 하나라도 true 이고 adminPanelBlocked 가 false 이면 /admin/login 시도 가능
     * 동일 정보: GET /api/admin-auth/config
     */
    adminLoginReady: !adminPanelBlocked && (adminEnvPasswordSet || adminPasswordHashInDatabase),
  });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}
