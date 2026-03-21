/**
 * 관리자 인증 상태 확인 API
 * 긴급 수정: 로그인 문제 해결을 위해 단순화된 로직으로 변경
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const COOKIE_NAME = "mimi_admin_auth";

export async function GET(req: NextRequest) {
  try {
    // 쿠키에서 인증 정보 확인
    const authCookie = req.cookies.get(COOKIE_NAME);
    const isAuthenticated = !!authCookie?.value;
    
    // 응답 생성
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
  } catch (error) {
    console.error("Admin auth check error:", error);
    return NextResponse.json(
      { ok: false, error: "인증 상태 확인 중 오류가 발생했습니다." },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      }
    );
  }
}