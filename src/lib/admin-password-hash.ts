"use client";

/**
 * 관리자 비밀번호 해시 — localStorage + Supabase(app_data) 동기화
 * 운영에서 브라우저마다 따로 '최초 설정'이 되는 문제 방지
 */
import { fetchData, saveData } from "./data-sync";

export const ADMIN_PW_HASH_KEY = "mimi_admin_password_hash";

/** 서버·로컬 병합 조회 (원격이 있으면 우선, localStorage에 반영) */
export async function getAdminPasswordHash(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const remote = await fetchData<string>(ADMIN_PW_HASH_KEY);
    const local = localStorage.getItem(ADMIN_PW_HASH_KEY);
    if (remote != null && typeof remote === "string" && remote.length > 0) {
      if (local !== remote) localStorage.setItem(ADMIN_PW_HASH_KEY, remote);
      return remote;
    }
    return local;
  } catch {
    return localStorage.getItem(ADMIN_PW_HASH_KEY);
  }
}

/** 저장 시 로컬 + Supabase */
export async function saveAdminPasswordHash(hash: string): Promise<void> {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_PW_HASH_KEY, hash);
  await saveData(ADMIN_PW_HASH_KEY, hash);
}

/**
 * 최초 비밀번호 "설정" 화면 허용 여부
 * - 개발: 항상 허용(해시 없을 때)
 * - 운영: NEXT_PUBLIC_ALLOW_ADMIN_SETUP=1 일 때만 (최초 1회 후 0으로)
 */
export function isAdminSetupAllowed(): boolean {
  if (typeof window === "undefined") return false; // 서버 사이드에서는 기본적으로 false
  if (typeof process === "undefined") return true; // process가 정의되지 않은 환경에서는 허용
  if (process.env.NODE_ENV === "development") return true; // 개발 환경에서는 항상 허용
  return process.env.NEXT_PUBLIC_ALLOW_ADMIN_SETUP === "1" || process.env.NEXT_PUBLIC_ALLOW_ADMIN_SETUP === "true";
}
