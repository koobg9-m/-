/**
 * 동기화 상태 진단 API
 * Supabase 연결 여부 및 app_data 테스트
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfiguredServer } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const result: {
    ok: boolean;
    configured: boolean;
    error?: string;
    testRead?: boolean;
    testWrite?: boolean;
  } = {
    ok: false,
    configured: isSupabaseConfiguredServer(),
  };

  if (!result.configured) {
    result.error = "Supabase env not set (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)";
    return NextResponse.json(result);
  }

  try {
    const supabase = getSupabaseAdmin();
    const testKey = `_sync_test_${Date.now()}`;

    // 테스트 쓰기
    const { error: writeErr } = await (supabase as any)
      .from("app_data")
      .upsert({ key: testKey, value: { test: true }, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (writeErr) {
      result.error = `Write failed: ${writeErr.message}`;
      if (writeErr.code === "42P01") result.error += " (app_data 테이블이 없습니다. SETUP.md 참고)";
      return NextResponse.json(result);
    }
    result.testWrite = true;

    // 테스트 읽기
    const { data, error: readErr } = await (supabase as any)
      .from("app_data")
      .select("value")
      .eq("key", testKey)
      .single();

    if (readErr || !data) {
      result.error = `Read failed: ${readErr?.message ?? "no data"}`;
      return NextResponse.json(result);
    }
    result.testRead = true;

    // 테스트 데이터 삭제
    await (supabase as any).from("app_data").delete().eq("key", testKey);

    result.ok = true;
    return NextResponse.json(result);
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    return NextResponse.json(result);
  }
}
