"use client";

/**
 * PC/모바일 실시간 데이터 동기화
 * Supabase 설정 시 API 사용, 미설정 시 localStorage
 */

const API = "/api/data";

function isSupabaseConfigured(): boolean {
  if (typeof window === "undefined") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return !!url && !!key && url.startsWith("http");
}

/** API에서 값 조회 */
export async function fetchData<T = unknown>(key: string): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const res = await fetch(`${API}?key=${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return (json.value ?? null) as T | null;
  } catch {
    return null;
  }
}

/** API에 값 저장 */
export async function saveData(key: string, value: unknown): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Realtime 구독 - 변경 시 콜백 호출 */
export function subscribeDataKey(key: string, onUpdate: () => void): () => void {
  if (!isSupabaseConfigured() || typeof window === "undefined") return () => {};
  let unsub: (() => void) | null = null;
  const init = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const channel = supabase
        .channel(`app_data:${key}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "app_data", filter: `key=eq.${key}` }, () => {
          onUpdate();
        })
        .subscribe();
      unsub = () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Realtime 미지원 시 무시
    }
  };
  init();
  return () => unsub?.();
}
