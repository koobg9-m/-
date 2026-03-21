"use client";

/**
 * PC/모바일 실시간 데이터 동기화
 * Supabase 설정 시 API 사용, 미설정 시 localStorage
 */

const API = "/api/data";

import { isSupabaseConfigured as checkSupabaseConfig } from "@/lib/supabase/client";

function isSupabaseConfigured(): boolean {
  if (typeof window === "undefined") return false;
  return checkSupabaseConfig();
}

function getApiUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
}

/** API에서 값 조회 (재시도 2회) */
export async function fetchData<T = unknown>(key: string): Promise<T | null> {
  if (!isSupabaseConfigured()) return null;
  const url = `${getApiUrl(API)}?key=${encodeURIComponent(key)}&_t=${Date.now()}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
          continue;
        }
        return null;
      }
      const json = await res.json();
      return (json.value ?? null) as T | null;
    } catch {
      if (attempt < 2) await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
      else return null;
    }
  }
  return null;
}

/** API에 값 저장 (재시도 1회) */
export async function saveData(key: string, value: unknown): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const url = getApiUrl(API);
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) return true;
      if (attempt < 1) await new Promise((r) => setTimeout(r, 500));
    } catch {
      if (attempt < 1) await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

/** 동기화 상태 진단 */
export async function getSyncStatus(): Promise<{ ok: boolean; configured: boolean; error?: string }> {
  try {
    const res = await fetch(`${getApiUrl("/api/sync-status")}?_t=${Date.now()}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
    const json = await res.json();
    return json;
  } catch (e) {
    return { ok: false, configured: false, error: e instanceof Error ? e.message : String(e) };
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
      if (!supabase) return;
      
      const channel = supabase
        .channel(`app_data:${key}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "app_data", filter: `key=eq.${key}` }, () => {
          onUpdate();
        })
        .subscribe();
      
      unsub = () => {
        if (supabase && channel) {
          supabase.removeChannel(channel);
        }
      };
    } catch (error) {
      console.error("Supabase Realtime subscription error:", error);
      // Realtime 미지원 시 무시
    }
  };
  init();
  return () => unsub?.();
}
