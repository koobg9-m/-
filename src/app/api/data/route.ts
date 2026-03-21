/**
 * app_data 키-값 저장 API
 * PC/모바일 실시간 동기화용 - Supabase app_data 테이블 사용
 * Supabase 미설정/실패 시 503 → 클라이언트는 localStorage 폴백
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfiguredServer } from "@/lib/supabase/admin";
import { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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
    const { error } = await supabase
      .from("app_data")
      .upsert({ key: key.trim(), value: value ?? {}, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) {
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
      }
      throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/data POST]", e);
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
}
