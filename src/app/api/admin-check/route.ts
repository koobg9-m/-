/**
 * 관리자 설정 확인용 API
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    adminDisabled: process.env.NEXT_PUBLIC_DISABLE_ADMIN === "1" || process.env.NEXT_PUBLIC_DISABLE_ADMIN === "true",
    adminAllowSetup: process.env.NEXT_PUBLIC_ALLOW_ADMIN_SETUP === "1" || process.env.NEXT_PUBLIC_ALLOW_ADMIN_SETUP === "true",
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}