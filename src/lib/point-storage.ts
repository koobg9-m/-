"use client";

import { fetchData, saveData } from "./data-sync";

const POINT_SETTINGS_KEY = "mimi_point_settings";
const CUSTOMER_POINTS_KEY = "mimi_customer_points";
const POINT_HISTORY_KEY = "mimi_point_history";

export type PointSettings = {
  /** 결제금액 1원당 적립 포인트 (예: 0.01 = 1%) */
  earnRate: number;
  /** 1포인트 = ?원 (사용 시 할인) */
  pointValueWon: number;
  /** 최대 사용 비율 (0~100, 예: 30 = 결제금액의 30%까지 포인트 사용 가능) */
  maxUsePercent: number;
  /** 포인트 사용 가능 최소 이용횟수 (2 = 2회차부터 사용 가능) */
  minVisitToUse: number;
  /** 포인트 유효기간 (일, 0 = 무제한) */
  expiryDays: number;
};

const DEFAULT_SETTINGS: PointSettings = {
  earnRate: 0.01,
  pointValueWon: 1,
  maxUsePercent: 30,
  minVisitToUse: 2,
  expiryDays: 365,
};

export function getPointSettings(): PointSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(POINT_SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function savePointSettings(settings: Partial<PointSettings>): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getPointSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(POINT_SETTINGS_KEY, JSON.stringify(merged));
    void saveData(POINT_SETTINGS_KEY, merged);
    return true;
  } catch {
    return false;
  }
}

type CustomerPointsMap = Record<string, { points: number; updatedAt: string }>;

/** Supabase에서 포인트 설정·고객 포인트·이력 불러오기 */
export async function hydratePointsFromRemote(): Promise<void> {
  if (typeof window === "undefined") return;
  const [settings, map, history] = await Promise.all([
    fetchData<Partial<PointSettings>>(POINT_SETTINGS_KEY),
    fetchData<CustomerPointsMap>(CUSTOMER_POINTS_KEY),
    fetchData<{ key: string; amount: number; type: "earn" | "use"; reason: string; bookingId?: string; createdAt: string }[]>(POINT_HISTORY_KEY),
  ]);
  if (settings != null && typeof settings === "object") {
    const merged = { ...DEFAULT_SETTINGS, ...settings };
    localStorage.setItem(POINT_SETTINGS_KEY, JSON.stringify(merged));
  }
  if (map != null && typeof map === "object") {
    localStorage.setItem(CUSTOMER_POINTS_KEY, JSON.stringify(map));
  }
  if (history != null && Array.isArray(history)) {
    localStorage.setItem(POINT_HISTORY_KEY, JSON.stringify(history.slice(0, 500)));
  }
}

function customerKey(phone?: string, email?: string): string {
  const p = (phone ?? "").trim();
  const e = (email ?? "").trim();
  if (p) return normalizePhone(p) ? `phone:${normalizePhone(p)}` : `phone:${p}`;
  if (e) return `email:${e.toLowerCase()}`;
  return "unknown";
}

function normalizePhone(p: string): string {
  return p.replace(/\D/g, "");
}

function getCustomerPointsMap(): CustomerPointsMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CUSTOMER_POINTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCustomerPointsMap(map: CustomerPointsMap): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CUSTOMER_POINTS_KEY, JSON.stringify(map));
  void saveData(CUSTOMER_POINTS_KEY, map);
}

/** 고객 보유 포인트 조회 */
export function getCustomerPoints(phone?: string, email?: string): number {
  const key = customerKey(phone, email);
  if (!key || key === "unknown") return 0;
  const map = getCustomerPointsMap();
  const entry = map[key];
  return entry?.points ?? 0;
}

/** 결제금액 기준 적립 포인트 계산 */
export function calcEarnPoints(price: number): number {
  const s = getPointSettings();
  return Math.floor(price * s.earnRate);
}

/** 포인트 사용 시 할인금액 계산 */
export function calcDiscountFromPoints(points: number): number {
  const s = getPointSettings();
  return points * s.pointValueWon;
}

/** 최대 사용 가능 포인트 (결제금액, 보유포인트 기준) */
export function getMaxUsablePoints(totalPrice: number, ownedPoints: number): number {
  const s = getPointSettings();
  const maxByPercent = Math.floor((totalPrice * (s.maxUsePercent / 100)) / s.pointValueWon);
  return Math.min(ownedPoints, maxByPercent);
}

/** 포인트 적립 */
export function addPoints(phone: string | undefined, email: string | undefined, amount: number, reason: string, bookingId?: string): void {
  const key = customerKey(phone, email);
  if (!key || key === "unknown" || amount <= 0) return;
  const map = getCustomerPointsMap();
  const current = map[key] ?? { points: 0, updatedAt: new Date().toISOString() };
  map[key] = {
    points: current.points + amount,
    updatedAt: new Date().toISOString(),
  };
  saveCustomerPointsMap(map);
  addPointHistory(key, amount, "earn", reason, bookingId);
}

/** 포인트 사용 (차감) */
export function deductPoints(phone: string | undefined, email: string | undefined, amount: number, reason: string, bookingId?: string): boolean {
  const key = customerKey(phone, email);
  if (!key || key === "unknown" || amount <= 0) return false;
  const map = getCustomerPointsMap();
  const current = map[key] ?? { points: 0, updatedAt: new Date().toISOString() };
  if (current.points < amount) return false;
  map[key] = {
    points: current.points - amount,
    updatedAt: new Date().toISOString(),
  };
  saveCustomerPointsMap(map);
  addPointHistory(key, -amount, "use", reason, bookingId);
  return true;
}

/** 관리자: 고객 포인트 수동 조정 */
export function setCustomerPoints(phone: string | undefined, email: string | undefined, points: number): void {
  const key = customerKey(phone, email);
  if (!key || key === "unknown") return;
  const map = getCustomerPointsMap();
  map[key] = { points: Math.max(0, points), updatedAt: new Date().toISOString() };
  saveCustomerPointsMap(map);
}

type PointHistoryItem = { key: string; amount: number; type: "earn" | "use"; reason: string; bookingId?: string; createdAt: string };

function addPointHistory(key: string, amount: number, type: "earn" | "use", reason: string, bookingId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(POINT_HISTORY_KEY);
    const list: PointHistoryItem[] = raw ? JSON.parse(raw) : [];
    list.unshift({ key, amount, type, reason, bookingId, createdAt: new Date().toISOString() });
    const trimmed = list.slice(0, 500);
    localStorage.setItem(POINT_HISTORY_KEY, JSON.stringify(trimmed));
    void saveData(POINT_HISTORY_KEY, trimmed);
  } catch {
    // ignore
  }
}
