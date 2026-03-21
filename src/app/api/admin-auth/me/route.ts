/**
 * 관리자 인증 상태 확인 API
 * 쿠키 기반으로 인증 상태를 확인합니다.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "mimi_admin_auth";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME);
  const isAuthenticated = !!cookie?.value;
  
  return NextResponse.json({ ok: isAuthenticated });
}