"use client";

import type { CustomerProfile } from "./groomer-types";

const CUSTOMER_KEY = "mimi_customer_profile";

export function getCustomerProfile(): CustomerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    const p = raw ? JSON.parse(raw) : null;
    if (p && !Array.isArray(p.pets)) p.pets = [];
    return p;
  } catch {
    return null;
  }
}

export function saveCustomerProfile(profile: CustomerProfile): boolean {
  if (typeof window === "undefined") return false;
  try {
    const json = JSON.stringify(profile);
    localStorage.setItem(CUSTOMER_KEY, json);
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
