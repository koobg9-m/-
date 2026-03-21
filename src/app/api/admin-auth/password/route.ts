/**
 * 관리자 비밀번호 변경 API
 */
import { NextRequest, NextResponse } from "next/server";
import { hashPasswordSha256 } from "@/lib/admin-auth-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const COOKIE_NAME = "mimi_admin_auth";

export async function POST(req: NextRequest) {
  try {
    // 인증 확인
    const authCookie = req.cookies.get(COOKIE_NAME);
    if (!authCookie?.value) {
      return NextResponse.json(
        { error: "인증되지 않은 요청입니다." },
        { status: 401 }
      );
    }
    
    // 요청 본문 파싱
    const body = await req.json();
    const password = typeof body.password === "string" ? body.password : "";
    
    // 비밀번호 유효성 검사
    if (password.length < 6) {
      return NextResponse.json(
        { error: "비밀번호는 최소 6자 이상이어야 합니다." },
        { status: 400 }
      );
    }
    
    // 비밀번호 해시 생성
    const passwordHash = hashPasswordSha256(password);
    
    // 로컬 스토리지에 비밀번호 해시 저장 (클라이언트 측에서 처리)
    // 실제 저장은 클라이언트 측에서 처리하므로 여기서는 해시만 반환
    
    return NextResponse.json(
      { 
        success: true, 
        message: "비밀번호가 성공적으로 변경되었습니다.",
        hash: passwordHash  // 클라이언트에서 저장할 해시
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      }
    );
  } catch (error) {
    console.error("비밀번호 변경 오류:", error);
    return NextResponse.json(
      { error: "비밀번호 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}