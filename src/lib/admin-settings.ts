"use client";

import { fetchData, saveData } from "./data-sync";

const ADMIN_SETTINGS_KEY = "mimi_admin_settings";

export type AdminSettings = {
  /** 플랫폼 수수료율 (0~100, 예: 10 = 10%) */
  commissionRate: number;
  /** 플랫폼명 */
  platformName?: string;
  /** 정산 주기 (일 단위, 예: 7 = 주 1회) */
  settlementCycleDays?: number;
  /** 보낼 계좌 (송금 출금 계좌) - 정산 시 사용하는 플랫폼 계좌 */
  settlementBankName?: string;
  settlementAccountNumber?: string;
  settlementAccountHolder?: string;
  /** VAT 포함 여부 */
  vatIncluded?: boolean;
  /** SMS API 연동 여부 (실제 발송용) */
  smsApiEnabled?: boolean;
  /** 미용 추천 리마인더 사용 여부 (완료 후 N일 뒤 1주일 전 발송) */
  groomingReminderEnabled?: boolean;
  /** 미용 추천 주기 (일 단위, 기본 28일 = 4주) */
  groomingReminderIntervalDays?: number;
};

const DEFAULT: AdminSettings = {
  commissionRate: 10,
  platformName: "미미살롱펫",
  settlementCycleDays: 7,
  vatIncluded: false,
  groomingReminderEnabled: true,
  groomingReminderIntervalDays: 28,
};

export async function getAdminSettingsAsync(): Promise<AdminSettings> {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const fromApi = await fetchData<Partial<AdminSettings>>(ADMIN_SETTINGS_KEY);
    const raw = localStorage.getItem(ADMIN_SETTINGS_KEY);
    const fromLocal = raw ? JSON.parse(raw) : {};
    const merged = { ...DEFAULT, ...fromLocal, ...fromApi };
    return merged;
  } catch {
    return getAdminSettings();
  }
}

export function getAdminSettings(): AdminSettings {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(ADMIN_SETTINGS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...DEFAULT, ...parsed };
  } catch {
    return DEFAULT;
  }
}

export async function saveAdminSettingsAsync(settings: Partial<AdminSettings>): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const current = getAdminSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(merged));
    return await saveData(ADMIN_SETTINGS_KEY, merged);
  } catch {
    return false;
  }
}

export function saveAdminSettings(settings: Partial<AdminSettings>): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getAdminSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(merged));
    saveData(ADMIN_SETTINGS_KEY, merged).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

/** 정산금액 = 서비스총액 - 수수료 (포인트는 정산에서 제외) */
export function calcSettlementAmount(serviceTotal: number, commissionRate: number): number {
  const fee = Math.round(serviceTotal * (commissionRate / 100));
  return serviceTotal - fee;
}

/** 디자이너 수수료 = 서비스총액 × 수수료율 */
export function calcCommission(serviceTotal: number, commissionRate: number): number {
  return Math.round(serviceTotal * (commissionRate / 100));
}

/** 정산용 서비스총액 (포인트 할인 전) - 기존 예약은 price+포인트할인액으로 역산 */
export function getServiceTotalForSettlement(
  booking: { price: number; pointsUsed?: number; serviceTotal?: number },
  pointValueWon: number = 1
): number {
  if (booking.serviceTotal != null && booking.serviceTotal > 0) return booking.serviceTotal;
  const pointsDiscount = (booking.pointsUsed ?? 0) * pointValueWon;
  return booking.price + pointsDiscount;
}
