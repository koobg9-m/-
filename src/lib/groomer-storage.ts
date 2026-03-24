"use client";

import type { GroomerProfile, Booking, ServiceItem } from "./groomer-types";
import { SERVICE_DEFS, getServicePrice } from "./services";
import { fetchData, saveData } from "./data-sync";
import { isSupabaseConfigured } from "./supabase/client";

const GROOMER_KEY = "mimi_groomer_profiles";
const BOOKING_KEY = "mimi_bookings";

function normalizePhone(p: string): string {
  return p.replace(/\D/g, "");
}

function normalizeList<T>(list: T[], mapper: (p: T) => T): T[] {
  return Array.isArray(list) ? list.map(mapper) : [];
}

function dedupeById<T extends { id?: unknown }>(list: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of list) {
    const idRaw = item?.id;
    const id = idRaw == null ? "" : String(idRaw);
    if (!id) continue;
    // "마지막 값을 유지" (업데이트 로직 이후에는 toSave가 마지막에 반영되는 형태로 동작)
    map.set(id, item);
  }
  return Array.from(map.values());
}

/** 기본 서비스 → 디자이너용 서비스 아이템 변환 (표시용 기준가: 소형견 5kg) */
export function serviceToItem(id: string) {
  const s = SERVICE_DEFS.find((x) => x.id === id);
  if (!s) return null;
  const price = getServicePrice(s.id, "소형견", "5kg미만") || 50000;
  return { id: s.id, name: s.name, price, duration: s.duration };
}

/** 디자이너는 모든 표준 미용 서비스 제공 — 선택 UI 없이 항상 전체 목록 */
export function buildAllServiceItemsForGroomer(): ServiceItem[] {
  return SERVICE_DEFS.map((s) => ({
    id: s.id,
    name: s.name,
    price: getServicePrice(s.id, "소형견", "5kg미만") || 50000,
    duration: s.duration,
  }));
}

function mapGroomer(p: GroomerProfile): GroomerProfile {
  const address = p.address ?? p.area ?? "";
  const radiusKm = p.radiusKm ?? 10;
  const services = buildAllServiceItemsForGroomer();
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

/** API + local 머지 — 비밀번호는 서버(Supabase) 값이 있으면 항상 우선 (옛 local 해시가 덮어쓰면 로그인 실패) */
function mergeGroomerApiWithLocal(apiItem: GroomerProfile, local?: GroomerProfile): GroomerProfile {
  if (!local) return apiItem;
  const localPatch = Object.fromEntries(
    Object.entries(local).filter(([_, v]) => {
      if (v == null) return false;
      if (typeof v === "string") return v.trim().length > 0;
      return true;
    })
  ) as Partial<GroomerProfile>;
  const merged = { ...apiItem, ...localPatch } as GroomerProfile;
  const apiHash = typeof apiItem.passwordHash === "string" && apiItem.passwordHash.trim().length > 0;
  if (apiHash) merged.passwordHash = apiItem.passwordHash;
  const apiPlain = typeof apiItem.passwordPlain === "string" && apiItem.passwordPlain.trim().length > 0;
  if (apiPlain) merged.passwordPlain = apiItem.passwordPlain;
  return merged;
}

/** 디자이너 프로필 목록 (Supabase 설정 시 API, 아니면 localStorage) */
export async function getGroomerProfiles(): Promise<GroomerProfile[]> {
  if (typeof window === "undefined") return [];
  const fromApi = await fetchData<GroomerProfile[]>(GROOMER_KEY);
  const localList = getFromLocal<GroomerProfile[]>(GROOMER_KEY, []);

  // Supabase 동기화가 약간 지연/실패하더라도, 같은 브라우저에서 방금 저장한
  // "사진/주소" 같은 필드는 localStorage 기준으로 먼저 반영하도록 머지합니다.
  const localMap = new Map<string, GroomerProfile>();
  for (const p of localList) {
    const id = p?.id == null ? "" : String(p.id);
    if (!id) continue;
    localMap.set(id, p);
  }

  let mergedList: GroomerProfile[];
  if (fromApi != null) {
    const seenIds = new Set<string>();
    mergedList = fromApi.map((apiItem) => {
      const id = apiItem?.id == null ? "" : String(apiItem.id);
      if (id) seenIds.add(id);
      const local = id ? localMap.get(id) : undefined;
      return mergeGroomerApiWithLocal(apiItem, local);
    });
    // API 목록에 아직 없는 id(이 기기에서만 생성·저장된 경우)는 local 행을 유지
    for (const local of localList) {
      const id = local?.id == null ? "" : String(local.id);
      if (!id || seenIds.has(id)) continue;
      mergedList.push(local);
      seenIds.add(id);
    }
    localStorage.setItem(GROOMER_KEY, JSON.stringify(mergedList));
  } else {
    mergedList = localList;
  }

  return normalizeList(dedupeById(mergedList), mapGroomer);
}

/** 동기 버전 - localStorage만 (초기 로딩/폴백용) */
export function getGroomerProfilesSync(): GroomerProfile[] {
  if (typeof window === "undefined") return [];
  const list = getFromLocal<GroomerProfile[]>(GROOMER_KEY, []);
  return normalizeList(dedupeById(list), mapGroomer);
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
      services: buildAllServiceItemsForGroomer(),
    };
    if (idx >= 0) {
      toSave.suspended = list[idx].suspended;
      // 동일 id 중복이 이미 존재할 수 있으므로, 전부 toSave로 치환
      const next = list.map((p) => (String(p.id ?? "") === targetId ? toSave : p));
      const deduped = dedupeById(next);
      localStorage.setItem(GROOMER_KEY, JSON.stringify(deduped)); // 로컬 즉시 반영
      const ok = await saveData(GROOMER_KEY, deduped); // Supabase 동기화
      if (!ok && isSupabaseConfigured()) return false;
      return true;
    } else {
      const next = [...list, toSave];
      const deduped = dedupeById(next);
      localStorage.setItem(GROOMER_KEY, JSON.stringify(deduped)); // 로컬 즉시 반영
      const ok = await saveData(GROOMER_KEY, deduped); // Supabase 동기화
      if (!ok && isSupabaseConfigured()) return false;
      return true;
    }
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

/** 예약에서 고객 식별 키 (관리자 고객 목록과 동일 규칙) */
export function bookingCustomerKey(b: Booking): string {
  return (b.customerPhone ?? "").trim() || (b.customerEmail ?? "").trim() || "unknown";
}

/** 관리자: 디자이너 프로필 삭제 */
export async function deleteGroomer(id: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const list = await getGroomerProfiles();
    const next = list.filter((p) => String(p.id ?? "") !== String(id));
    if (next.length === list.length) return false;
    localStorage.setItem(GROOMER_KEY, JSON.stringify(next));
    await saveData(GROOMER_KEY, next);
    return true;
  } catch {
    return false;
  }
}

/** 관리자: 해당 고객 키(전화 또는 이메일 문자열)와 일치하는 예약을 모두 삭제 */
export async function deleteBookingsForCustomerKey(customerKey: string): Promise<number> {
  if (typeof window === "undefined" || !customerKey || customerKey === "unknown") return 0;
  const list = await getBookings();
  const filtered = list.filter((b) => bookingCustomerKey(b) !== customerKey);
  const removed = list.length - filtered.length;
  if (removed === 0) return 0;
  localStorage.setItem(BOOKING_KEY, JSON.stringify(filtered));
  await saveData(BOOKING_KEY, filtered);
  return removed;
}
