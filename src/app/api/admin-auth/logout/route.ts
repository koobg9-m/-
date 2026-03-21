/**
 * 관리자 로그아웃 API
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const COOKIE_NAME = "mimi_admin_auth";
const paths = ['/', '/admin', '/admin/login'];

export async function POST() {
  try {
    const res = NextResponse.json({ ok: true });
    
    // 인증 쿠키 삭제
    paths.forEach((path) => {
      res.cookies.delete(COOKIE_NAME, { path });
    });
    
    // 캐시 방지 헤더 추가
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    
    return res;
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "로그아웃 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}