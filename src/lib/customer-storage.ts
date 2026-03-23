"use client";

import type { CustomerProfile } from "./groomer-types";
import { fetchData, saveData } from "./data-sync";

const CUSTOMER_KEY_PREFIX = "mimi_customer_profile";

function getCustomerKey(phone?: string, email?: string): string {
  const p = (phone ?? "").trim();
  const e = (email ?? "").trim();
  if (p) return `${CUSTOMER_KEY_PREFIX}:phone:${p.replace(/\D/g, "")}`;
  if (e) return `${CUSTOMER_KEY_PREFIX}:email:${e.toLowerCase()}`;
  return CUSTOMER_KEY_PREFIX; // 폴백: 단일 프로필 (기기별)
}

/** 로그인 정보에서 키 생성 */
function getCustomerKeyFromStorage(): string {
  if (typeof window === "undefined") return CUSTOMER_KEY_PREFIX;
  try {
    const raw = localStorage.getItem("mimi_demo_user");
    const u = raw ? JSON.parse(raw) : null;
    if (u?.phone) return `${CUSTOMER_KEY_PREFIX}:phone:${String(u.phone).replace(/\D/g, "")}`;
    if (u?.email) return `${CUSTOMER_KEY_PREFIX}:email:${String(u.email).toLowerCase()}`;
  } catch {
    // ignore
  }
  return CUSTOMER_KEY_PREFIX;
}

/** localStorage에서 동기 조회 */
function getFromLocal(key: string): CustomerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    const p = raw ? JSON.parse(raw) : null;
    if (p && !Array.isArray(p.pets)) p.pets = [];
    return p;
  } catch {
    return null;
  }
}

/** 고객 프로필 조회 (Supabase 설정 시 동기화) */
export async function getCustomerProfile(phone?: string, email?: string): Promise<CustomerProfile | null> {
  if (typeof window === "undefined") return null;
  const key = (phone || email) ? getCustomerKey(phone, email) : getCustomerKeyFromStorage();
  const fromApi = await fetchData<CustomerProfile>(key);
  const p = fromApi ?? getFromLocal(CUSTOMER_KEY_PREFIX); // API 없으면 로컬 폴백
  if (p && !Array.isArray(p.pets)) p.pets = [];
  return p;
}

/** 동기 버전 - localStorage만 */
export function getCustomerProfileSync(): CustomerProfile | null {
  return getFromLocal(CUSTOMER_KEY_PREFIX);
}

/** 관리자: 해당 연락처로 저장된 고객 프로필 로컬 키 제거 */
export function deleteCustomerProfileStorage(phone?: string, email?: string): void {
  if (typeof window === "undefined") return;
  const key = getCustomerKey(phone, email);
  if (key === CUSTOMER_KEY_PREFIX) return;
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export async function saveCustomerProfile(profile: CustomerProfile): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const key = getCustomerKey(profile.phone, profile.email);
    if (profile.phone || profile.email) {
      await saveData(key, profile);
    }
    localStorage.setItem(CUSTOMER_KEY_PREFIX, JSON.stringify(profile)); // 로컬 즉시 반영
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      console.error("[mimi] 저장 실패: 저장 공간 초과. 반려동물 사진을 줄이거나 삭제해 주세요.");
    } else {
      console.error("[mimi] 저장 실패:", e);
    }
    return false;
  }
}

export function isCustomerProfileComplete(profile: CustomerProfile | null): boolean {
  if (!profile) return false;
  return !!(profile.name?.trim() && profile.phone?.trim() && profile.address?.trim());
}

export function hasPets(profile: CustomerProfile | null): boolean {
  return !!(profile?.pets?.length);
}

/** 예약 진행 가능 (고객정보 + 반려동물 1마리 이상) */
export function canProceedToBooking(profile: CustomerProfile | null): boolean {
  return isCustomerProfileComplete(profile) && hasPets(profile);
}
