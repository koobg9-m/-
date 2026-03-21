/**
 * 관리자 인증 상태 확인 API
 * 쿠키를 확인하여 인증 상태를 반환합니다.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const COOKIE_NAME = "mimi_admin_auth";

export async function GET(req: NextRequest) {
  // 쿠키에서 인증 정보 확인
  const authCookie = req.cookies.get(COOKIE_NAME);
  const isAuthenticated = !!authCookie?.value;
  
  // 캐시 방지 헤더 추가
  return NextResponse.json(
    { ok: isAuthenticated },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      }
    }
  );
}