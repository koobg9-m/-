import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getSkipFlag(): { enabled: boolean; keyUsed: string | null } {
  const candidates = ["SKIP_SMS_SEND", "skip_sms_send"] as const;
  for (const key of candidates) {
    const v = process.env[key];
    // Vercel은 값이 문자열로 들어오므로, "1"만 케이스를 허용 (너무 관대하게 하지 않음)
    if (v === "1") return { enabled: true, keyUsed: key };
  }
  return { enabled: false, keyUsed: null };
}

function getSmsEnvMode(): "aligo" | "skip" | "none" {
  const skip = getSkipFlag();
  if (skip.enabled) return "skip";
  const hasAligo = !!(process.env.ALIGO_USER_ID && process.env.ALIGO_API_KEY && process.env.ALIGO_SENDER);
  return hasAligo ? "aligo" : "none";
}

function getSmsEnvDebug(): {
  skipSmsSendSet: boolean;
  skipSmsKeyUsed: string | null;
  aligo: { userId: boolean; apiKey: boolean; sender: boolean };
} {
  const skip = getSkipFlag();
  const skipSmsSendSet = skip.enabled;
  return {
    skipSmsSendSet,
    skipSmsKeyUsed: skip.keyUsed,
    aligo: {
      userId: !!process.env.ALIGO_USER_ID,
      apiKey: !!process.env.ALIGO_API_KEY,
      sender: !!process.env.ALIGO_SENDER,
    },
  };
}

async function getEgressIpFromIpify(): Promise<string | null> {
  try {
    const res = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    const data = (await res.json()) as { ip?: string };
    return data.ip ?? null;
  } catch {
    return null;
  }
}

/**
 * SMS 연동 상태 (비밀값 노출 없음) — 관리자 UI 표시용
 */
export async function GET() {
  const mode = getSmsEnvMode();
  const egressIp = await getEgressIpFromIpify();
  return NextResponse.json({
    mode,
    /** 실제 발송 또는 SKIP 모드로 API가 성공 응답을 줄 수 있는지 */
    ready: mode !== "none",
    debug: getSmsEnvDebug(),
    egressIp,
  });
}

/**
 * SMS 발송 API
 * - 알리고(Aligo) 연동: ALIGO_USER_ID, ALIGO_API_KEY, ALIGO_SENDER 환경변수 설정 시 실제 발송
 * - 미설정 시 스텁 모드 (성공 반환, 실제 발송 없음)
 */
async function sendViaAligo(to: string, body: string): Promise<{ ok: boolean; error?: string; egressIp?: string | null }> {
  const userId = process.env.ALIGO_USER_ID;
  const apiKey = process.env.ALIGO_API_KEY;
  const sender = process.env.ALIGO_SENDER;
  if (!userId || !apiKey || !sender) {
    return { ok: false, error: "ALIGO_USER_ID, ALIGO_API_KEY, ALIGO_SENDER 환경변수가 설정되지 않았습니다.", egressIp: null };
  }
  const egressIp = await getEgressIpFromIpify();

  const receiver = to.replace(/\D/g, "");
  if (receiver.length < 10) return { ok: false, error: "수신번호가 올바르지 않습니다." };

  // 알리고에 등록된 발신번호 포맷과 환경변수에 들어간 값이 다를 때가 많아
  // 하이픈/공백 같은 문자를 제거한 값도 함께 사용합니다.
  const senderParam = sender.replace(/\D/g, "") || sender;

  const params = new URLSearchParams();
  params.set("key", apiKey);
  params.set("user_id", userId);
  params.set("sender", senderParam);
  params.set("receiver", receiver);
  params.set("msg", body);
  if (process.env.ALIGO_TESTMODE === "Y") params.set("testmode_yn", "Y");

  const res = await fetch("https://apis.aligo.in/send/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  let data: { result_code?: number | string; message?: string };
  try {
    data = (await res.json()) as { result_code?: number | string; message?: string };
  } catch {
    return { ok: false, error: "알리고 응답을 해석할 수 없습니다.", egressIp };
  }
  /** 알리고: result_code === 1 이면 성공 */
  const code = Number(data.result_code);
  if (code === 1) {
    return { ok: true };
  }
  return {
    ok: false,
    error:
      data.message?.trim() ||
      `알리고 오류 (코드 ${Number.isNaN(code) ? "?" : code})`,
    egressIp,
  };
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

    const mode = getSmsEnvMode();
    if (mode === "skip") {
      const skip = getSkipFlag();
      return NextResponse.json({
        success: true,
        message: `개발 모드: SMS 발송 생략 (${skip.keyUsed ?? "SKIP_SMS_SEND"}=1)`,
      });
    }
    if (mode === "aligo") {
      const result = await sendViaAligo(to, body);
      if (!result.ok) {
        const egressNote = result.egressIp ? ` (egress IP: ${result.egressIp})` : "";
        return NextResponse.json({ error: (result.error ?? "SMS 발송 실패") + egressNote }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: "SMS 발송 완료" });
    }

    const egressIp = await getEgressIpFromIpify();
    return NextResponse.json(
      {
        error:
          "SMS 연동이 설정되지 않았습니다. .env에 ALIGO_USER_ID, ALIGO_API_KEY, ALIGO_SENDER를 설정하거나, 테스트용으로 SKIP_SMS_SEND=1을 설정해 주세요.",
        debug: getSmsEnvDebug(),
        egressIp,
      },
      { status: 503 }
    );
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
