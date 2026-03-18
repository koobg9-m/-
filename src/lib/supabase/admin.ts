/**
 * Supabase 서버용 클라이언트 (API 라우트에서 사용)
 * 쿠키/인증 없이 anon key로 app_data 테이블 접근
 */
import { createClient } from "@supabase/supabase-js";

let _client: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdmin() {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key || !url.startsWith("http")) {
    throw new Error("Supabase env not configured");
  }
  try {
    _client = createClient(url, key);
    return _client;
  } catch (e) {
    _client = null;
    throw e;
  }
}

export function isSupabaseConfiguredServer(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return !!url && !!key && url.startsWith("http");
}
