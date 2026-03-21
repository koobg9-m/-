/**
 * 운영 관리자 로그인
 * 1) Vercel 서버 전용 ADMIN_PASSWORD (평문, timing-safe)
 * 2) Supabase app_data 의 SHA-256 해시 (로컬에서 설정 후 동기화된 비밀번호와 동일)
 * 둘 중 하나라도 맞으면 쿠키 발급
 */
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getAdminPasswordHashFromDatabase, hashPasswordSha256 } from "@/lib/admin-auth-server";
import { isSupabaseConfiguredServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const COOKIE_NAME = "mimi_admin_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

function safeEqualUtf8(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

function setAuthCookieResponse(): NextResponse {
  const isProd = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "1", {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
  });
  return res;
}

export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  const envPassword = process.env.ADMIN_PASSWORD ?? "";
  const envOk = envPassword.length > 0 && safeEqualUtf8(password, envPassword);

  if (envOk) {
    return setAuthCookieResponse();
  }

  if (!isSupabaseConfiguredServer()) {
    if (envPassword.length > 0) {
      return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Supabase가 설정되지 않았습니다. Vercel에 ADMIN_PASSWORD 를 설정하세요." },
      { status: 503 },
    );
  }

  let storedHash: string | null;
  try {
    storedHash = await getAdminPasswordHashFromDatabase();
  } catch (e) {
    console.error("[admin-auth/login]", e);
    return NextResponse.json({ error: "관리자 비밀번호 정보를 불러오지 못했습니다." }, { status: 503 });
  }

  if (storedHash) {
    const inputHash = hashPasswordSha256(password);
    if (safeEqualHex(inputHash, storedHash)) {
      return setAuthCookieResponse();
    }
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  /* DB에 해시 없음 */
  if (envPassword.length > 0) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  return NextResponse.json(
    {
      error:
        "관리자 비밀번호가 아직 없습니다. Vercel에 ADMIN_PASSWORD 를 추가하거나, PC(로컬)에서 /admin/login 에서 비밀번호를 설정해 Supabase에 동기화하세요.",
    },
    { status: 503 },
  );
}
