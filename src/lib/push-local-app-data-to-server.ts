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

/** 
 * 동기화( Supabase ) 가능할 때만 호출
 * 성능 개선: 작은 배치로 나누어 처리하고 UI 스레드에 양보
 */
export async function pushLocalAppDataToServer(): Promise<PushLocalResult> {
  const result: PushLocalResult = { pushed: [], skipped: [], failed: [] };
  if (typeof window === "undefined") return result;

  const status = await getSyncStatus();
  if (!status.configured || !status.ok) {
    result.failed.push("(Supabase 연동 비정상 — sync-status 확인)");
    return result;
  }

  const keys = Array.from(new Set<string>([...FIXED_KEYS, ...collectCustomerProfileKeys()]));
  
  // 배치 크기 - 한 번에 처리할 키의 수
  const BATCH_SIZE = 5;
  
  // 배치로 나누어 처리
  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE);
    
    // 각 배치 처리 전에 UI 스레드에 양보
    await new Promise<void>(resolve => setTimeout(resolve, 0));
    
    // 배치 내 키들을 병렬로 처리
    const batchResults = await Promise.all(
      batch.map(async (key) => {
        const value = parseLocal(key);
        if (value === undefined) {
          return { key, status: 'skipped' as const };
        }
        const ok = await saveData(key, value);
        return { key, status: ok ? 'pushed' as const : 'failed' as const };
      })
    );
    
    // 결과 집계
    for (const res of batchResults) {
      if (res.status === 'pushed') result.pushed.push(res.key);
      else if (res.status === 'skipped') result.skipped.push(res.key);
      else result.failed.push(res.key);
    }
  }

  return result;
}
