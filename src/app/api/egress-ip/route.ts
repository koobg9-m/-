import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * 서버(egress) 공인 IP 확인용 디버그 엔드포인트.
 * Aligo "인증된 발송 IP" 화이트리스트 등록에 쓸 수 있습니다.
 */
export async function GET() {
  try {
    const res = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    const data = (await res.json()) as { ip?: string };
    return NextResponse.json({
      ip: data.ip ?? null,
      service: "ipify",
      note: "이 IP가 알리고에 등록할 발송 서버 IP입니다(운영 환경 기준).",
    });
  } catch {
    return NextResponse.json({ ip: null, error: "ipify 조회 실패" }, { status: 500 });
  }
}

