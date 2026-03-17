import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * SMS 발송 API
 * - 알리고(Aligo) 연동: ALIGO_USER_ID, ALIGO_API_KEY, ALIGO_SENDER 환경변수 설정 시 실제 발송
 * - 미설정 시 스텁 모드 (성공 반환, 실제 발송 없음)
 */
async function sendViaAligo(to: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const userId = process.env.ALIGO_USER_ID;
  const apiKey = process.env.ALIGO_API_KEY;
  const sender = process.env.ALIGO_SENDER;
  if (!userId || !apiKey || !sender) {
    return { ok: false, error: "ALIGO_USER_ID, ALIGO_API_KEY, ALIGO_SENDER 환경변수가 설정되지 않았습니다." };
  }
  const receiver = to.replace(/\D/g, "");
  if (receiver.length < 10) return { ok: false, error: "수신번호가 올바르지 않습니다." };

  const params = new URLSearchParams();
  params.set("key", apiKey);
  params.set("user_id", userId);
  params.set("sender", sender);
  params.set("receiver", receiver);
  params.set("msg", body);
  if (process.env.ALIGO_TESTMODE === "Y") params.set("testmode_yn", "Y");

  const res = await fetch("https://apis.aligo.in/send/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = (await res.json()) as { result_code?: number; message?: string };
  if (data.result_code != null && data.result_code > 0) {
    return { ok: true };
  }
  return { ok: false, error: data.message ?? "알리고 API 오류" };
}

export async function POST(req: NextRequest) {
  try {
    let to: string | undefined;
    let body: string | undefined;
    try {
      const json = await req.json();
      to = json?.to;
      body = json?.body;
    } catch {
      return NextResponse.json({ error: "잘못된 요청 형식입니다. JSON body에 to, body가 필요합니다." }, { status: 400 });
    }
    if (!to || !body) {
      return NextResponse.json({ error: "to, body 필수" }, { status: 400 });
    }

    const hasAligo = process.env.ALIGO_USER_ID && process.env.ALIGO_API_KEY && process.env.ALIGO_SENDER;
    const skipSms = process.env.SKIP_SMS_SEND === "1";
    if (skipSms) {
      return NextResponse.json({ success: true, message: "개발 모드: SMS 발송 생략" });
    }
    if (hasAligo) {
      const result = await sendViaAligo(to, body);
      if (!result.ok) {
        return NextResponse.json({ error: result.error ?? "SMS 발송 실패" }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: "SMS 발송 완료" });
    }

    return NextResponse.json(
      { error: "SMS 연동이 설정되지 않았습니다. .env에 ALIGO_USER_ID, ALIGO_API_KEY, ALIGO_SENDER를 설정하거나, 테스트용으로 SKIP_SMS_SEND=1을 설정해 주세요." },
      { status: 503 }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
