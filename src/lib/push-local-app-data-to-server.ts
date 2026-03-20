"use client";

/**
 * 로컬 브라우저(localStorage)의 app_data 키들을 Supabase(/api/data)에 덮어씀.
 * "서버에서 새로고침"의 반대 방향 — 로컬이 진실일 때 운영과 맞출 때 사용.
 */
import { saveData, getSyncStatus } from "./data-sync";
import { HOMEPAGE_CONTENT_KEY } from "./homepage-content-storage";
import { TIPS_KEY, NOTICES_KEY } from "./tips-notices-storage";
import {
  ADDITIONAL_FEES_KEY,
  SERVICE_PRICES_KEY,
  SERVICE_PRICES_LEGACY_KEY,
} from "./services";

const FIXED_KEYS = [
  HOMEPAGE_CONTENT_KEY,
  TIPS_KEY,
  NOTICES_KEY,
  "mimi_groomer_profiles",
  "mimi_bookings",
  ADDITIONAL_FEES_KEY,
  SERVICE_PRICES_KEY,
  SERVICE_PRICES_LEGACY_KEY,
  "mimi_point_settings",
  "mimi_customer_points",
  "mimi_point_history",
  "mimi_sms_templates",
  "mimi_sms_log",
  "mimi_admin_settings",
  "mimi_customer_profile",
] as const;

function collectCustomerProfileKeys(): string[] {
  if (typeof window === "undefined") return [];
  const out: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("mimi_customer_profile") && !out.includes(k)) out.push(k);
    }
  } catch {
    /* ignore */
  }
  return out;
}

function parseLocal(key: string): unknown | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === "") return undefined;
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

export type PushLocalResult = {
  pushed: string[];
  skipped: string[];
  failed: string[];
};

/** 동기화( Supabase ) 가능할 때만 호출 */
export async function pushLocalAppDataToServer(): Promise<PushLocalResult> {
  const result: PushLocalResult = { pushed: [], skipped: [], failed: [] };
  if (typeof window === "undefined") return result;

  const status = await getSyncStatus();
  if (!status.configured || !status.ok) {
    result.failed.push("(Supabase 연동 비정상 — sync-status 확인)");
    return result;
  }

  const keys = Array.from(new Set<string>([...FIXED_KEYS, ...collectCustomerProfileKeys()]));

  for (const key of keys) {
    const value = parseLocal(key);
    if (value === undefined) {
      result.skipped.push(key);
      continue;
    }
    const ok = await saveData(key, value);
    if (ok) result.pushed.push(key);
    else result.failed.push(key);
  }

  return result;
}
