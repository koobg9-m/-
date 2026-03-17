"use client";

import type { GroomerProfile, Booking } from "./groomer-types";
import { SERVICE_DEFS, getServicePrice } from "./services";

const GROOMER_KEY = "mimi_groomer_profiles";
const BOOKING_KEY = "mimi_bookings";

/** 기본 서비스 → 디자이너용 서비스 아이템 변환 (표시용 기준가: 소형견 5kg) */
export function serviceToItem(id: string) {
  const s = SERVICE_DEFS.find((x) => x.id === id);
  if (!s) return null;
  const price = getServicePrice(s.id, "소형견", "5kg미만") || 50000;
  return { id: s.id, name: s.name, price, duration: s.duration };
}

export function getGroomerProfiles(): GroomerProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GROOMER_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.map((p: GroomerProfile) => {
      const address = p.address ?? p.area ?? "";
      const radiusKm = p.radiusKm ?? 10;
      let services = p.services ?? [];
      if (services.length === 0) {
        services = SERVICE_DEFS.map((s) => ({
          id: s.id,
          name: s.name,
          price: getServicePrice(s.id, "소형견", "5kg미만") || 50000,
          duration: s.duration,
        }));
      }
      let availableSlots = p.availableSlots ?? [];
      if (availableSlots.length === 0) {
        const defaultTimes = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
        availableSlots = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          return { date: d.toISOString().slice(0, 10), times: defaultTimes };
        });
      }
      return { ...p, address, radiusKm, services, availableSlots };
    });
  } catch {
    return [];
  }
}

export function saveGroomerProfile(profile: GroomerProfile): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(GROOMER_KEY);
    const list: GroomerProfile[] = raw ? JSON.parse(raw) : [];
    const targetId = String(profile.id ?? "");
    const idx = list.findIndex((p) => String(p.id ?? "") === targetId);
    const toSave: GroomerProfile = {
      ...profile,
      id: profile.id,
      address: profile.address ?? profile.area ?? "",
      radiusKm: Number(profile.radiusKm) || 10,
    };
    if (idx >= 0) {
      // suspended(예약정지)는 관리자 전용 필드. 미용사 프로필 저장 시 기존 값을 항상 유지 (updateGroomer로만 변경 가능)
      toSave.suspended = list[idx].suspended;
      list[idx] = toSave;
    } else {
      list.push(toSave);
    }
    localStorage.setItem(GROOMER_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    if (typeof console !== "undefined" && console.error) console.error("saveGroomerProfile", e);
    return false;
  }
}

export function getGroomerById(id: string): GroomerProfile | null {
  return getGroomerProfiles().find((p) => p.id === id) ?? null;
}

/** 디자이너 프로필 일부 필드 업데이트 (관리자용) */
export function updateGroomer(id: string, updates: Partial<GroomerProfile>): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(GROOMER_KEY);
    const list: GroomerProfile[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((p) => String(p.id ?? "") === String(id));
    if (idx < 0) return false;
    list[idx] = { ...list[idx], ...updates };
    localStorage.setItem(GROOMER_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function getBookings(): Booking[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BOOKING_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return list.sort((a: Booking, b: Booking) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

/** 고객 전화번호 또는 이메일로 본인 예약 목록 조회 */
export function getBookingsByCustomer(phone?: string, email?: string): Booking[] {
  const all = getBookings();
  if (!phone?.trim() && !email?.trim()) return [];
  return all.filter((b) => {
    const matchPhone = phone?.trim() && (b.customerPhone ?? "").trim() && normalizePhone(b.customerPhone) === normalizePhone(phone);
    const matchEmail = email?.trim() && (b.customerEmail ?? "").trim() && (b.customerEmail ?? "").toLowerCase() === email.toLowerCase();
    return matchPhone || matchEmail;
  });
}

function normalizePhone(p: string): string {
  return p.replace(/\D/g, "");
}

export function saveBooking(booking: Booking) {
  const list = getBookings();
  list.unshift(booking);
  localStorage.setItem(BOOKING_KEY, JSON.stringify(list));
}

export function updateBooking(bookingId: string, updates: Partial<Booking>): boolean {
  if (typeof window === "undefined") return false;
  try {
    const list = getBookings();
    const idx = list.findIndex((b) => b.id === bookingId);
    if (idx < 0) return false;
    list[idx] = { ...list[idx], ...updates };
    localStorage.setItem(BOOKING_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}
