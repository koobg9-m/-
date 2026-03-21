/**
 * 관리자 인증 상태 확인 API
 * 이 API는 현재 비활성화되어 항상 인증되지 않은 상태를 반환합니다.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // 항상 인증되지 않은 상태 반환
  return NextResponse.json({ ok: false });
}