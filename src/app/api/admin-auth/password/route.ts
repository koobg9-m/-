/**
 * 관리자 비밀번호 변경 API
 */
import { NextRequest, NextResponse } from "next/server";
import { hashPasswordSha256 } from "@/lib/admin-auth-server";
import { isSupabaseConfiguredServer } from "@/lib/supabase/admin";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ADMIN_PW_HASH_KEY = "mimi_admin_password_hash";
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
    
    // 1. 환경 변수 비밀번호 변경 (Vercel에서는 API로 변경 불가능)
    // 환경 변수는 Vercel 대시보드에서 직접 변경해야 함
    
    // 2. 데이터베이스에 비밀번호 해시 저장
    if (isSupabaseConfiguredServer()) {
      try {
        const supabase = getSupabaseAdmin();
        
        // app_data 테이블에 비밀번호 해시 저장
        const { error } = await supabase
          .from("app_data")
          .upsert(
            { key: ADMIN_PW_HASH_KEY, value: passwordHash },
            { onConflict: "key" }
          );
        
        if (error) {
          console.error("비밀번호 해시 저장 오류:", error);
          return NextResponse.json(
            { error: "비밀번호 변경 중 오류가 발생했습니다." },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error("Supabase 오류:", error);
        return NextResponse.json(
          { error: "데이터베이스 연결 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
    }
    
    // 3. 코드의 하드코딩된 비밀번호 목록 업데이트 (API로 직접 변경 불가능)
    // 이 부분은 코드 수정 후 배포가 필요함
    
    return NextResponse.json(
      { success: true, message: "비밀번호가 성공적으로 변경되었습니다." },
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