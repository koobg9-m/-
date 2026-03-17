"use client";

const ADMIN_SETTINGS_KEY = "mimi_admin_settings";

export type AdminSettings = {
  /** 플랫폼 수수료율 (0~100, 예: 10 = 10%) */
  commissionRate: number;
  /** 플랫폼명 */
  platformName?: string;
  /** 정산 주기 (일 단위, 예: 7 = 주 1회) */
  settlementCycleDays?: number;
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

export function saveAdminSettings(settings: Partial<AdminSettings>): boolean {
  if (typeof window === "undefined") return false;
  try {
    const current = getAdminSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(merged));
    return true;
  } catch {
    return false;
  }
}

/** 정산금액 = 매출 - 수수료 */
export function calcSettlementAmount(price: number, commissionRate: number): number {
  const fee = Math.round(price * (commissionRate / 100));
  return price - fee;
}

export function calcCommission(price: number, commissionRate: number): number {
  return Math.round(price * (commissionRate / 100));
}
