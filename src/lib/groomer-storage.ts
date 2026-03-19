"use client";

import type { GroomerProfile, Booking } from "./groomer-types";
import { SERVICE_DEFS, getServicePrice } from "./services";
import { fetchData, saveData } from "./data-sync";

const GROOMER_KEY = "mimi_groomer_profiles";
const BOOKING_KEY = "mimi_bookings";

function normalizePhone(p: string): string {
  return p.replace(/\D/g, "");
}

function normalizeList<T>(list: T[], mapper: (p: T) => T): T[] {
  return Array.isArray(list) ? list.map(mapper) : [];
}

/** 기본 서비스 → 디자이너용 서비스 아이템 변환 (표시용 기준가: 소형견 5kg) */
export function serviceToItem(id: string) {
  const s = SERVICE_DEFS.find((x) => x.id === id);
  if (!s) return null;
  const price = getServicePrice(s.id, "소형견", "5kg미만") || 50000;
  return { id: s.id, name: s.name, price, duration: s.duration };
}

function mapGroomer(p: GroomerProfile): GroomerProfile {
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
}

/** localStorage에서 동기 조회 (Supabase 미설정 시) */
function getFromLocal<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : def;
  } catch {
    return def;
  }
}

/** 디자이너 프로필 목록 (Supabase 설정 시 API, 아니면 localStorage) */
export async function getGroomerProfiles(): Promise<GroomerProfile[]> {
  if (typeof window === "undefined") return [];
  const fromApi = await fetchData<GroomerProfile[]>(GROOMER_KEY);
  const list = fromApi ?? getFromLocal<GroomerProfile[]>(GROOMER_KEY, []);
  if (fromApi != null) localStorage.setItem(GROOMER_KEY, JSON.stringify(fromApi));
  return normalizeList(list, mapGroomer);
}

/** 동기 버전 - localStorage만 (초기 로딩/폴백용) */
export function getGroomerProfilesSync(): GroomerProfile[] {
  if (typeof window === "undefined") return [];
  const list = getFromLocal<GroomerProfile[]>(GROOMER_KEY, []);
  return normalizeList(list, mapGroomer);
}

export async function saveGroomerProfile(profile: GroomerProfile): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const list = await getGroomerProfiles();
    const targetId = String(profile.id ?? "");
    const idx = list.findIndex((p) => String(p.id ?? "") === targetId);
    const toSave: GroomerProfile = {
      ...profile,
      id: profile.id,
      address: profile.address ?? profile.area ?? "",
      radiusKm: Number(profile.radiusKm) || 10,
    };
    if (idx >= 0) {
      toSave.suspended = list[idx].suspended;
      list[idx] = toSave;
    } else {
      list.push(toSave);
    }
    localStorage.setItem(GROOMER_KEY, JSON.stringify(list)); // 로컬 즉시 반영
    await saveData(GROOMER_KEY, list); // Supabase 동기화
    return true;
  } catch (e) {
    if (typeof console !== "undefined" && console.error) console.error("saveGroomerProfile", e);
    return false;
  }
}

export async function getGroomerById(id: string): Promise<GroomerProfile | null> {
  const list = await getGroomerProfiles();
  return list.find((p) => p.id === id) ?? null;
}

/** 디자이너 프로필 일부 필드 업데이트 (관리자용) */
export async function updateGroomer(id: string, updates: Partial<GroomerProfile>): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const list = await getGroomerProfiles();
    const idx = list.findIndex((p) => String(p.id ?? "") === String(id));
    if (idx < 0) return false;
    list[idx] = { ...list[idx], ...updates };
    localStorage.setItem(GROOMER_KEY, JSON.stringify(list));
    await saveData(GROOMER_KEY, list);
    return true;
  } catch {
    return false;
  }
}

/** 예약 목록 */
export async function getBookings(): Promise<Booking[]> {
  if (typeof window === "undefined") return [];
  const fromApi = await fetchData<Booking[]>(BOOKING_KEY);
  const list = fromApi ?? getFromLocal<Booking[]>(BOOKING_KEY, []);
  if (fromApi != null) localStorage.setItem(BOOKING_KEY, JSON.stringify(fromApi));
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getBookingsSync(): Booking[] {
  if (typeof window === "undefined") return [];
  const list = getFromLocal<Booking[]>(BOOKING_KEY, []);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** 고객 전화번호 또는 이메일로 본인 예약 목록 조회 */
export async function getBookingsByCustomer(phone?: string, email?: string): Promise<Booking[]> {
  const all = await getBookings();
  if (!phone?.trim() && !email?.trim()) return [];
  return all.filter((b) => {
    const matchPhone = phone?.trim() && (b.customerPhone ?? "").trim() && normalizePhone(b.customerPhone) === normalizePhone(phone);
    const matchEmail = email?.trim() && (b.customerEmail ?? "").trim() && (b.customerEmail ?? "").toLowerCase() === email.toLowerCase();
    return matchPhone || matchEmail;
  });
}

export async function saveBooking(booking: Booking): Promise<void> {
  const list = await getBookings();
  list.unshift(booking);
  localStorage.setItem(BOOKING_KEY, JSON.stringify(list));
  await saveData(BOOKING_KEY, list);
}

export async function updateBooking(bookingId: string, updates: Partial<Booking>): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const list = await getBookings();
    const idx = list.findIndex((b) => b.id === bookingId);
    if (idx < 0) return false;
    list[idx] = { ...list[idx], ...updates };
  localStorage.setItem(BOOKING_KEY, JSON.stringify(list));
  await saveData(BOOKING_KEY, list);
    return true;
  } catch {
    return false;
  }
}
