/**
 * 운영 관리자 로그인
 * - Vercel ADMIN_PASSWORD / ADMIN_PASSWORDS
 * - Supabase app_data 의 mimi_admin_password_hash (비밀번호 변경 페이지로 저장한 경우)
 */
import { NextRequest, NextResponse } from "next/server";
import {
  getAdminPasswordHashFromDatabase,
  hashPasswordSha256,
} from "@/lib/admin-auth-server";
import { isSupabaseConfiguredServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const COOKIE_NAME = "mimi_admin_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h

/** ADMIN_PASSWORD + ADMIN_PASSWORDS(쉼표 구분)만 허용. 저장소에 기본 비밀번호를 넣지 않음. */
function getAllowedPasswords(): Set<string> {
  const set = new Set<string>();
  const primary = process.env.ADMIN_PASSWORD?.trim();
  if (primary) set.add(primary);
  const extra = process.env.ADMIN_PASSWORDS?.split(",") ?? [];
  for (const p of extra) {
    const t = p.trim();
    if (t) set.add(t);
  }
  return set;
}

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
    const password =
      typeof body.password === "string" ? body.password.trim() : "";

    const allowed = getAllowedPasswords();

    if (allowed.has(password)) {
      return setAuthCookieResponse();
    }

    // 비밀번호 변경 페이지에서 Supabase에 저장한 SHA-256 해시와 비교
    if (isSupabaseConfiguredServer()) {
      try {
        const dbHash = await getAdminPasswordHashFromDatabase();
        if (dbHash && hashPasswordSha256(password) === dbHash) {
          return setAuthCookieResponse();
        }
      } catch (e) {
        console.error("[admin-auth/login] DB hash check:", e);
      }
    }

    // 환경 변수도 없고 DB 해시도 없으면 로그인 불가 안내
    if (allowed.size === 0) {
      let hasDbHash = false;
      if (isSupabaseConfiguredServer()) {
        try {
          const h = await getAdminPasswordHashFromDatabase();
          hasDbHash = !!(h && h.length > 0);
        } catch {
          /* ignore */
        }
      }
      if (!hasDbHash) {
        console.error("[admin-auth/login] No ADMIN_PASSWORD and no DB hash");
        return NextResponse.json(
          {
            error:
              "서버에 관리자 비밀번호가 설정되지 않았습니다. Vercel에 ADMIN_PASSWORD를 넣거나, Supabase에 비밀번호 해시가 동기화돼 있는지 확인한 뒤 재배포해 주세요.",
          },
          {
            status: 503,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          }
        );
      }
    }

    return NextResponse.json(
      { error: "비밀번호가 올바르지 않습니다." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
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