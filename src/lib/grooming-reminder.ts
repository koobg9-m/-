"use client";

import { getBookings, updateBooking } from "./groomer-storage";
import { getAdminSettings } from "./admin-settings";
import { getSmsTemplates, fillTemplate, addSmsLog } from "./notification-storage";
import type { Booking } from "./groomer-types";

function customerKey(b: Booking): string {
  const phone = (b.customerPhone ?? "").trim();
  const email = (b.customerEmail ?? "").trim().toLowerCase();
  if (phone) return `phone:${phone.replace(/\D/g, "")}`;
  if (email) return `email:${email}`;
  return "";
}

/**
 * 서비스 완료 고객에게 추천 시기 1주일 전 자동 발송
 * - 완료일 + 주기(기본 28일) - 7일 = 발송일
 * - 관리자 페이지 로드 시 실행
 */
export async function checkAndSendGroomingReminders(): Promise<{ sent: number; skipped: number }> {
  const settings = getAdminSettings();
  if (!settings.groomingReminderEnabled) return { sent: 0, skipped: 0 };

  const intervalDays = settings.groomingReminderIntervalDays ?? 28;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const template = getSmsTemplates().find((t) => t.trigger === "grooming_recommend");
  const bodyTemplate = template?.body ?? "[미미살롱펫] {customerName}님, {petName}의 미용 추천 시기가 1주일 남았습니다. 예약해 주세요!";

  const allBookings = await getBookings();
  const completed = allBookings.filter((b) => b.status === "completed" && (b.customerPhone || b.customerEmail));

  // 고객별 가장 최근 완료 예약 (날짜 기준)
  const byCustomer = new Map<string, Booking>();
  for (const b of completed) {
    const key = customerKey(b);
    if (!key) continue;
    const existing = byCustomer.get(key);
    const bDate = b.date ?? "";
    const existingDate = existing?.date ?? "";
    if (!existing || bDate > existingDate) {
      byCustomer.set(key, b);
    }
  }

  let sent = 0;
  let skipped = 0;

  for (const booking of Array.from(byCustomer.values())) {
    if (booking.groomingReminderSentAt) {
      skipped++;
      continue;
    }

    const completedDate = booking.date ?? "";
    if (!completedDate) continue;

    const sendDate = addDays(completedDate, intervalDays - 7);
    if (today < sendDate) {
      skipped++;
      continue;
    }

    // 오늘 발송 대상
    const phone = (booking.customerPhone ?? "").trim();
    if (!phone || !/^[\d-]+$/.test(phone.replace(/\s/g, ""))) {
      skipped++;
      continue;
    }

    const petName = booking.pets?.[0]?.name ?? booking.petName ?? "반려동물";
    const filled = fillTemplate(bodyTemplate, {
      customerName: booking.customerName ?? "고객",
      petName,
      date: "",
      time: "",
      groomerName: booking.groomerName ?? "",
      serviceName: booking.serviceName ?? "",
    });

    addSmsLog({
      id: `S${Date.now()}-reminder-${booking.id}`,
      templateId: template?.id,
      to: phone,
      body: filled,
      status: "sent",
      createdAt: new Date().toISOString(),
      bookingId: booking.id,
    });

    await updateBooking(booking.id, { groomingReminderSentAt: new Date().toISOString() });
    sent++;
  }

  return { sent, skipped };
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
