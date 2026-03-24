"use client";

import type { Booking } from "@/lib/groomer-types";

/** 고객 예약 취소 확정 시 알림 문자 수신 번호 */
export const ADMIN_BOOKING_CANCEL_NOTIFY_PHONE = "01045462955";

/**
 * 고객이 예약을 취소했을 때 관리자에게 문자 알림 (/api/sms · 알리고·SKIP 모드)
 * @returns 발송 시도 결과 (예약 취소 자체와는 별개)
 */
export async function notifyAdminBookingCancelled(b: Booking): Promise<{ ok: boolean; error?: string }> {
  const body = [
    "[미미살롱펫] 고객 예약 취소",
    `서비스: ${b.serviceName ?? "—"}`,
    `일시: ${b.date ?? "—"} ${b.time ?? ""}`.trim(),
    b.customerName ? `고객: ${b.customerName}` : null,
    `연락처: ${(b.customerPhone ?? "").trim() || "—"}`,
    `디자이너: ${b.groomerName ?? "—"}`,
    `주소: ${(b.address ?? "").trim() || "—"}`,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  try {
    const res = await fetch("/api/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ to: ADMIN_BOOKING_CANCEL_NOTIFY_PHONE, body }),
    });
    const data = (await res.json()) as { error?: string; success?: boolean };
    if (!res.ok) {
      return { ok: false, error: data.error ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
