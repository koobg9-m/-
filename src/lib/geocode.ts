"use client";

const CACHE_KEY = "mimi_geocode_cache";
const CACHE_MAX = 200;

type CacheEntry = { lat: number; lng: number; ts: number };

function getCache(): Record<string, CacheEntry> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setCache(cache: Record<string, CacheEntry>) {
  if (typeof window === "undefined") return;
  const keys = Object.keys(cache);
  if (keys.length > CACHE_MAX) {
    const sorted = keys.sort((a, b) => (cache[a].ts ?? 0) - (cache[b].ts ?? 0));
    for (let i = 0; i < keys.length - CACHE_MAX; i++) {
      delete cache[sorted[i]];
    }
  }
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

const GEOCODE_AVAILABLE_KEY = "mimi_geocode_available";

function isGeocodeAvailable(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = sessionStorage.getItem(GEOCODE_AVAILABLE_KEY);
    return v !== "0";
  } catch {
    return true;
  }
}

function setGeocodeUnavailable() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(GEOCODE_AVAILABLE_KEY, "0");
  } catch {
    // ignore
  }
}

/** 주소 → 좌표 (API 호출, 캐시 사용, 5초 타임아웃) */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = address.trim();
  if (!key) return null;
  if (!isGeocodeAvailable()) return null;
  const cache = getCache();
  const cached = cache[key];
  if (cached && Date.now() - (cached.ts ?? 0) < 86400000) {
    return { lat: cached.lat, lng: cached.lng };
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`/api/geocode?address=${encodeURIComponent(key)}`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.status === 503) {
      setGeocodeUnavailable();
      return null;
    }
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.lat != null && data?.lng != null) {
      cache[key] = { lat: data.lat, lng: data.lng, ts: Date.now() };
      setCache(cache);
      return { lat: data.lat, lng: data.lng };
    }
  } catch {
    setGeocodeUnavailable();
  }
  return null;
}

/** 두 좌표 간 거리(km) - Haversine */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
