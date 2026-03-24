/**
 * 운영 서버에서 관리자 비밀번호 검증 (Supabase app_data 해시)
 * 클라이언트 hashPassword(SHA-256 hex)와 동일 알고리즘
 */
import { createHash } from "crypto";
import { getSupabaseAdmin, isSupabaseConfiguredServer } from "@/lib/supabase/admin";

export const ADMIN_PW_HASH_KEY = "mimi_admin_password_hash";

export function hashPasswordSha256(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

/** JSONB value → SHA-256 hex(64자) 정규화 (따옴표·공백·객체 래핑 등) */
export function normalizeAdminPasswordHashFromValue(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === "object" && val !== null && "hash" in val && typeof (val as { hash: unknown }).hash === "string") {
    return normalizeAdminPasswordHashFromValue((val as { hash: string }).hash);
  }
  if (typeof val === "string") {
    const t = val.trim();
    if (!t) return null;
    const lower = t.toLowerCase();
    if (/^[a-f0-9]{64}$/.test(lower)) return lower;
    const m = t.match(/[a-f0-9]{64}/i);
    if (m) return m[0].toLowerCase();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("{") && t.includes("hash"))) {
      try {
        const parsed = JSON.parse(t) as unknown;
        return normalizeAdminPasswordHashFromValue(parsed);
      } catch {
        return null;
      }
    }
  }
  return null;
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
    return normalizeAdminPasswordHashFromValue(row?.value);
  } catch {
    return null;
  }
}
