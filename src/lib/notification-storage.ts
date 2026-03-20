"use client";

import { fetchData, saveData } from "./data-sync";

const SMS_TEMPLATES_KEY = "mimi_sms_templates";
const SMS_LOG_KEY = "mimi_sms_log";

export type SmsTemplate = {
  id: string;
  name: string;
  /** {customerName}, {date}, {time}, {groomerName}, {serviceName} 등 치환 가능 */
  body: string;
  trigger?: "booking_confirmed" | "service_complete" | "reminder" | "grooming_recommend" | "manual";
};

export type SmsLog = {
  id: string;
  templateId?: string;
  to: string;
  body: string;
  status: "sent" | "failed" | "pending";
  createdAt: string;
  bookingId?: string;
  error?: string;
};

const DEFAULT_TEMPLATES: SmsTemplate[] = [
  { id: "confirm", name: "예약확정", body: "[미미살롱펫] {customerName}님, 예약이 확정되었습니다.\n날짜: {date} {time}\n디자이너: {groomerName}\n서비스: {serviceName}", trigger: "booking_confirmed" },
  { id: "complete", name: "서비스완료", body: "[미미살롱펫] {customerName}님, 오늘 미용 서비스가 완료되었습니다. 감사합니다.", trigger: "service_complete" },
  { id: "reminder", name: "예약 리마인더", body: "[미미살롱펫] {customerName}님, 내일 {date} {time} 미용 예약이 있습니다.", trigger: "reminder" },
  { id: "grooming_recommend", name: "미용 추천", body: "[미미살롱펫] {customerName}님, {petName}의 미용 추천 시기가 1주일 남았습니다. 예약해 주세요!", trigger: "grooming_recommend" },
];

export function getSmsTemplates(): SmsTemplate[] {
  if (typeof window === "undefined") return DEFAULT_TEMPLATES;
  try {
    const raw = localStorage.getItem(SMS_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_TEMPLATES;
  } catch {
    return DEFAULT_TEMPLATES;
  }
}

export function saveSmsTemplates(templates: SmsTemplate[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(SMS_TEMPLATES_KEY, JSON.stringify(templates));
    void saveData(SMS_TEMPLATES_KEY, templates);
    return true;
  } catch {
    return false;
  }
}

export function getSmsLog(limit = 100): SmsLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SMS_LOG_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.slice(0, limit);
  } catch {
    return [];
  }
}

export function addSmsLog(log: SmsLog): void {
  if (typeof window === "undefined") return;
  const list = getSmsLog(500);
  list.unshift(log);
  const trimmed = list.slice(0, 500);
  localStorage.setItem(SMS_LOG_KEY, JSON.stringify(trimmed));
  void saveData(SMS_LOG_KEY, trimmed);
}

/** Supabase에서 SMS 템플릿·로그 불러오기 */
export async function hydrateNotificationFromRemote(): Promise<void> {
  if (typeof window === "undefined") return;
  const [templates, logs] = await Promise.all([
    fetchData<SmsTemplate[]>(SMS_TEMPLATES_KEY),
    fetchData<SmsLog[]>(SMS_LOG_KEY),
  ]);
  if (templates != null && Array.isArray(templates)) {
    localStorage.setItem(SMS_TEMPLATES_KEY, JSON.stringify(templates));
  }
  if (logs != null && Array.isArray(logs)) {
    localStorage.setItem(SMS_LOG_KEY, JSON.stringify(logs.slice(0, 500)));
  }
}

/** 템플릿 변수 치환 */
export function fillTemplate(body: string, vars: Record<string, string>): string {
  let result = body;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value ?? "");
  }
  return result;
}
