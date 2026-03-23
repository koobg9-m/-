/**
 * app_data 키-값 저장 API
 * PC/모바일 실시간 동기화용 - Supabase app_data 테이블 사용
 * Supabase 미설정/실패 시 503 → 클라이언트는 localStorage 폴백
 *
 * "canceling statement due to statement timeout" 시:
 * - Supabase Dashboard → SQL → `SHOW statement_timeout;` (기본 8s 등)
 * - 큰 JSON(예약에 미용 사진 base64 다수)이면 행 업데이트가 오래 걸림 → 사진·로그 정리 또는 DB에서 statement_timeout 상향
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfiguredServer } from "@/lib/supabase/admin";
import { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
/** Vercel 서버리스 제한 완화(초). DB가 느릴 때도 끝까지 기다림 */
export const maxDuration = 60;

function safeGetSupabase(): SupabaseClient | null {
  try {
    if (!isSupabaseConfiguredServer()) return null;
    return getSupabaseAdmin();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = safeGetSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }
    const key = req.nextUrl.searchParams.get("key");
    if (!key?.trim()) {
      return NextResponse.json({ error: "key required" }, { status: 400 });
    }
    const { data, error } = await supabase.from("app_data").select("value").eq("key", key).single();
    if (error) {
      if (error.code === "PGRST116") return NextResponse.json({ value: null });
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
      }
      throw error;
    }
    const row = data as { value?: unknown } | null;
    return NextResponse.json({ value: row?.value ?? null });
  } catch (e) {
    console.error("[api/data GET]", e);
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
}

function isStatementTimeout(err: { message?: string; code?: string } | null): boolean {
  const m = (err?.message ?? "").toLowerCase();
  return m.includes("statement timeout") || m.includes("canceling statement") || err?.code === "57014";
}

export async function POST(req: NextRequest) {
  try {
    const supabase = safeGetSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
    }
    const body = await req.json();
    const { key, value } = body as { key?: string; value?: unknown };
    if (!key || typeof key !== "string" || !key.trim()) {
      return NextResponse.json({ error: "key required" }, { status: 400 });
    }
    const payloadSize = JSON.stringify(value ?? {}).length;
    if (payloadSize > 5_000_000) {
      console.warn("[api/data POST] large payload", key, payloadSize);
      return NextResponse.json(
        {
          error: "PAYLOAD_TOO_LARGE",
          message: "저장 데이터가 너무 큽니다. 예약·미용 사진(base64)을 줄이거나 삭제한 뒤 다시 시도하세요.",
        },
        { status: 413 }
      );
    }
    const { error } = await supabase
      .from("app_data")
      .upsert(
        { key: key.trim(), value: value ?? {}, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
      }
      if (isStatementTimeout(error)) {
        console.error("[api/data POST] statement timeout", key, payloadSize);
        return NextResponse.json(
          {
            error: "STATEMENT_TIMEOUT",
            message:
              "DB 저장 시간이 초과되었습니다. (statement timeout) 데이터가 크거나 서버가 바쁠 수 있습니다. 잠시 후 재시도하거나 Supabase에서 statement_timeout을 늘리세요.",
          },
          { status: 503 }
        );
      }
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/data POST]", e);
    const msg = e instanceof Error ? e.message : String(e);
    if (isStatementTimeout({ message: msg })) {
      return NextResponse.json(
        {
          error: "STATEMENT_TIMEOUT",
          message:
            "DB 저장 시간이 초과되었습니다. 잠시 후 재시도하거나 예약 데이터(사진) 용량을 줄이세요.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
}
