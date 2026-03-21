/**
 * 운영 관리자 로그인
 * 긴급 수정: 로그인 문제 해결을 위해 단순화된 로직으로 변경
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const COOKIE_NAME = "mimi_admin_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

// 하드코딩된 비밀번호 목록 (임시 해결책)
// 여기에 원하는 비밀번호를 추가하거나 수정하세요
const VALID_PASSWORDS = ["미미살롱2024", "mimi2024", "admin2024", "원하는_새_비밀번호"];

function setAuthCookieResponse(): NextResponse {
  const isProd = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true });
  
  // 인증 쿠키 설정
  res.cookies.set(COOKIE_NAME, "1", {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
  });
  
  // 캐시 방지 헤더 추가
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  
  return res;
}

export async function POST(req: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await req.json();
    const password = typeof body.password === "string" ? body.password : "";
    
    console.log("Password input received, length:", password.length);
    
    // 1. 하드코딩된 비밀번호 확인 (가장 간단한 해결책)
    if (VALID_PASSWORDS.includes(password)) {
      console.log("Valid password match found");
      return setAuthCookieResponse();
    }
    
    // 2. 환경 변수 비밀번호 확인
    const envPassword = process.env.ADMIN_PASSWORD;
    if (envPassword && envPassword.length > 0 && password === envPassword) {
      console.log("Environment password match");
      return setAuthCookieResponse();
    }
    
    // 비밀번호가 일치하지 않음
    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      { 
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        }
      }
    );
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "로그인 처리 중 오류가 발생했습니다." },
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