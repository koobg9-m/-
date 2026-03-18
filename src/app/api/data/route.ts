/**
 * app_data 키-값 저장 API
 * PC/모바일 실시간 동기화용 - Supabase app_data 테이블 사용
 */
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfiguredServer } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  if (!isSupabaseConfiguredServer()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const key = req.nextUrl.searchParams.get("key");
  if (!key?.trim()) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await (supabase as any).from("app_data").select("value").eq("key", key).single();
    if (error) {
      if (error.code === "PGRST116") return NextResponse.json({ value: null }); // not found
      throw error;
    }
    const row = data as { value?: unknown } | null;
    return NextResponse.json({ value: row?.value ?? null });
  } catch (e) {
    console.error("[api/data GET]", e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfiguredServer()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  try {
    const body = await req.json();
    const { key, value } = body as { key?: string; value?: unknown };
    if (!key || typeof key !== "string" || !key.trim()) {
      return NextResponse.json({ error: "key required" }, { status: 400 });
    }
    const supabase = getSupabaseAdmin();
    const { error } = await (supabase as any)
      .from("app_data")
      .upsert({ key: key.trim(), value: value ?? {}, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/data POST]", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
