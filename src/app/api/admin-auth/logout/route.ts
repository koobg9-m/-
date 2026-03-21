/**
 * 관리자 로그아웃 API
 * 인증 쿠키를 삭제합니다.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = NextResponse.json({ ok: true });
  
  // 쿠키 삭제 (여러 경로에 대해 시도)
  const paths = ['/', '/admin', '/admin/login'];
  
  for (const path of paths) {
    res.cookies.set("mimi_admin_auth", "", {
      path,
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
    });
  }
  
  return res;
}