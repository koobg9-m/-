/**
 * 배포 버전 확인용 API
 * https://mimisalon.vercel.app/api/version 접속 시 현재 배포 버전 확인
 */
import { NextResponse } from "next/server";

const DEPLOY_VERSION = "v2.7";
const DEPLOY_TIME = "2026-03-20";

export async function GET() {
  const res = NextResponse.json({
    version: DEPLOY_VERSION,
    deployTime: DEPLOY_TIME,
    timestamp: new Date().toISOString(),
  });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}
