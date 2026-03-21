/**
 * 관리자 로그인 방식 안내 (비밀번호 값은 노출하지 않음)
 */
import { NextResponse } from "next/server";
import { isSupabaseConfiguredServer } from "@/lib/supabase/admin";
import { getAdminPasswordHashFromDatabase } from "@/lib/admin-auth-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasEnvPassword = !!(process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length > 0);
  let hasPasswordHashInDb = false;
  if (isSupabaseConfiguredServer()) {
    try {
      const h = await getAdminPasswordHashFromDatabase();
      hasPasswordHashInDb = !!(h && h.length > 0);
    } catch {
      hasPasswordHashInDb = false;
    }
  }

  return NextResponse.json({
    /** Vercel 서버 전용 ADMIN_PASSWORD 로 로그인 가능 */
    envPasswordAuth: hasEnvPassword,
    supabaseConfigured: isSupabaseConfiguredServer(),
    /** Supabase app_data 에 관리자 해시 존재 여부 */
    hasPasswordHashInDb,
  });
}
