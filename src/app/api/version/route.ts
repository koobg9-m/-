/**
 * 배포 버전 확인용 API
 * https://mimisalon.vercel.app/api/version 접속 시 현재 배포 버전 확인
 */
import { NextResponse } from "next/server";
import { SITE_VERSION } from "@/lib/site-version";

const DEPLOY_TIME = "2026-03-20";

/** 고객용 /login UI — 앱에서 사용하는 방식만 (Supabase Phone Provider와 무관) */
const CUSTOMER_LOGIN_METHODS = ["kakao", "email"] as const;

export async function GET() {
  const res = NextResponse.json({
    version: SITE_VERSION,
    deployTime: DEPLOY_TIME,
    timestamp: new Date().toISOString(),
    /** 고객 로그인: 카카오 + 이메일 매직링크만 (휴대폰 SMS OTP 미사용) */
    customerLoginMethods: [...CUSTOMER_LOGIN_METHODS],
    customerPhoneOtpLogin: false,
  });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}
