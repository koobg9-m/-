/**
 * 운영 서버에서 관리자 비밀번호 검증 (Supabase app_data 해시)
 * 클라이언트 hashPassword(SHA-256 hex)와 동일 알고리즘
 */
import { createHash } from "crypto";
import { getSupabaseAdmin, isSupabaseConfiguredServer } from "@/lib/supabase/admin";
import { SupabaseClient } from "@supabase/supabase-js";

export const ADMIN_PW_HASH_KEY = "mimi_admin_password_hash";

export function hashPasswordSha256(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

/** Supabase app_data 에 저장된 관리자 비밀번호 해시 (로컬 설정 후 동기화된 값) */
export async function getAdminPasswordHashFromDatabase(): Promise<string | null> {
  if (!isSupabaseConfiguredServer()) return null;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from("app_data").select("value").eq("key", ADMIN_PW_HASH_KEY).single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    const row = data as { value?: unknown } | null;
    const val = row?.value;
    if (typeof val === "string" && val.trim().length > 0) return val.trim();
    return null;
  } catch {
    return null;
  }
}
