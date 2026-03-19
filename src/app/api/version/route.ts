/**
 * 배포 버전 확인용 API
 * https://mimisalon.vercel.app/api/version 접속 시 현재 배포 버전 확인
 */
import { NextResponse } from "next/server";

const DEPLOY_VERSION = "v2.4";
const DEPLOY_TIME = "2025-03-18";

export async function GET() {
  return NextResponse.json({
    version: DEPLOY_VERSION,
    deployTime: DEPLOY_TIME,
    timestamp: new Date().toISOString(),
  });
}
