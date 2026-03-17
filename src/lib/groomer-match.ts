import type { GroomerProfile } from "./groomer-types";
import { geocodeAddress, distanceKm } from "./geocode";

/** 주소 정규화 (공백·형식 통일, 시/도 표기 통일) */
function normalizeAddr(addr: string): string {
  return addr
    .trim()
    .replace(/[,，]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b서울시\b/g, "서울")
    .replace(/\b서울특별시\b/g, "서울")
    .replace(/\b경기도\b/g, "경기")
    .replace(/\b부산시\b/g, "부산")
    .trim();
}

/** 주소에서 시/구 추출 (예: "서울 강남구 역삼동" → ["서울", "강남구"]) */
function getAddressParts(addr: string): string[] {
  return normalizeAddr(addr).split(/\s+/).filter(Boolean).slice(0, 4);
}

/** 시/도 명칭 정규화 (서울특별시→서울, 경기도→경기 등) */
function normalizeSiDo(part: string): string {
  let s = part.replace(/특별시|광역시|특별자치시|도|특별자치도/g, "").trim();
  s = s.replace(/시$/, "").trim();
  if (s === "세종") return "세종";
  if (s.startsWith("제주")) return "제주";
  return s;
}

/** 구/군/시/동 정규화 (강남구→강남, 사당동→사당 등) */
function normalizeGu(part: string): string {
  return part.replace(/(구|군|시|동)$/, "").trim();
}

/** 고객 주소에 디자이너 지역(구/군/동)이 포함되는지 확인 */
function customerAddressContainsGroomerArea(custAddr: string, groomerAddr: string): boolean {
  const custNorm = normalizeAddr(custAddr);
  const groomParts = getAddressParts(groomerAddr);
  if (groomParts.length === 0) return true;
  for (const part of groomParts) {
    const normalized = normalizeGu(part);
    if (normalized.length >= 2 && (custNorm.includes(part) || custNorm.includes(normalized))) return true;
  }
  return false;
}

/** 주소 기반 추정 거리(km) - 시/구/동 계층으로 근사 (서울 등 대도시 구 간 8km) */
function estimateDistanceKm(customerAddr: string, groomerAddr: string): number {
  const cust = getAddressParts(customerAddr);
  let groom = getAddressParts(groomerAddr);
  if (cust.length === 0 || groom.length === 0) return 0;
  if (groom.length === 1 && cust.length >= 2) {
    groom = getAddressParts(`${cust[0]} ${cust[1]} ${groomerAddr}`);
  }
  const custSi = normalizeSiDo(cust[0]);
  const groomSi = normalizeSiDo(groom[0]);
  if (custSi !== groomSi) return 50;
  const custGu = cust.length >= 2 ? normalizeGu(cust[1]) : "";
  const groomGu = groom.length >= 2 ? normalizeGu(groom[1]) : "";
  if (custGu !== groomGu) return 8;
  const custDong = cust.length >= 3 ? cust[2].replace(/동|로|길/g, "") : "";
  const groomDong = groom.length >= 3 ? groom[2].replace(/동|로|길/g, "") : "";
  if (custDong && groomDong && custDong !== groomDong) return 3;
  return 1;
}

/** 거리 점수: 낮을수록 가까움. 같은 구=0, 같은 시=1, 그 외=2 */
function getDistanceScore(customerAddr: string, groomerAddr: string): number {
  const km = estimateDistanceKm(customerAddr, groomerAddr);
  if (km <= 5) return 0;
  if (km <= 15) return 1;
  return 2;
}

/** 주소 포함 관계 (같은 지역 여부) - 부분 일치도 허용 */
function isAddressOverlap(custAddr: string, groomerAddr: string): boolean {
  const c = normalizeAddr(custAddr);
  const g = normalizeAddr(groomerAddr);
  if (!c || !g) return true;
  if (c === g) return true;
  if (c.includes(g) || g.includes(c)) return true;
  const custParts = getAddressParts(custAddr);
  const groomParts = getAddressParts(groomerAddr);
  if (custParts.length >= 1 && groomParts.length >= 1) {
    const custSi = normalizeSiDo(custParts[0]);
    const groomSi = normalizeSiDo(groomParts[0]);
    const custGu = custParts.length >= 2 ? normalizeGu(custParts[1]) : "";
    const groomGu = groomParts.length >= 2 ? normalizeGu(groomParts[1]) : (/(구|군|시)$/.test(groomParts[0]) ? normalizeGu(groomParts[0]) : "");
    if (custSi === groomSi) {
      if (groomGu && custGu) return custGu === groomGu;
      return true;
    }
  }
  return false;
}

/** 고객 주소가 디자이너가 설정한 반경(radiusKm) 내인지 판단 (주소 기반 추정, 폴백용) */
function isInServiceAreaEstimate(customerAddr: string, groomer: GroomerProfile): boolean {
  const groomerAddr = (groomer.address ?? groomer.area ?? "").trim();
  const custAddr = customerAddr.trim();
  if (!custAddr || !groomerAddr) return true;
  const radiusKm = groomer.radiusKm ?? 10;
  if (isAddressOverlap(custAddr, groomerAddr)) return true;
  const custParts = getAddressParts(custAddr);
  const groomParts = getAddressParts(groomerAddr);
  if (custParts.length >= 1 && groomParts.length >= 1) {
    const custSi = normalizeSiDo(custParts[0]);
    const groomSi = normalizeSiDo(groomParts[0]);
    if (custSi === groomSi) return true;
    if (/(구|군|시)$/.test(groomParts[0])) {
      const groomGu = normalizeGu(groomParts[0]);
      const custGu = custParts.length >= 2 ? normalizeGu(custParts[1]) : "";
      if (custGu === groomGu) return true;
    }
    if (groomParts.length === 1 && /(구|군|시)$/.test(groomParts[0])) {
      const groomGu = normalizeGu(groomParts[0]);
      const custHasGu = custParts.some((p, i) => i >= 1 && normalizeGu(p) === groomGu);
      if (custHasGu) return true;
    }
    if (customerAddressContainsGroomerArea(custAddr, groomerAddr)) return true;
  }
  const estimatedKm = estimateDistanceKm(custAddr, groomerAddr);
  return estimatedKm <= radiusKm;
}

export type MatchResult = {
  groomer: GroomerProfile;
  distanceScore: number;
  service: { id: string; name: string; price: number };
};

/** 예약정지 디자이너 제외 */
function filterActiveGroomers<T extends GroomerProfile>(groomers: T[]): T[] {
  return groomers.filter((g) => !g.suspended);
}

/** 서비스·날짜·시간·고객주소에 맞는 디자이너 매칭 (거리순) - 동기, 주소 추정 폴백 */
export function matchGroomers(
  groomers: GroomerProfile[],
  serviceId: string,
  date: string,
  time: string,
  customerAddress: string
): MatchResult[] {
  const results: MatchResult[] = [];
  const active = filterActiveGroomers(groomers);
  for (const g of active) {
    const service = g.services.find((s) => s.id === serviceId);
    if (!service) continue;
    const slot = g.availableSlots.find((s) => s.date === date && s.times.includes(time));
    if (!slot) continue;
    if (!isInServiceAreaEstimate(customerAddress, g)) continue;
    const score = getDistanceScore(customerAddress, g.address ?? g.area ?? "");
    results.push({ groomer: g, distanceScore: score, service });
  }
  results.sort((a, b) => a.distanceScore - b.distanceScore);
  return results;
}

/** 서비스·날짜·시간·고객주소에 맞는 디자이너 매칭 (지도 API 기반 거리, 병렬 geocoding) */
export async function matchGroomersWithGeocode(
  groomers: GroomerProfile[],
  serviceId: string,
  date: string,
  time: string,
  customerAddress: string
): Promise<MatchResult[]> {
  const active = filterActiveGroomers(groomers);
  const candidates = active
    .map((g) => ({ g, service: g.services.find((s) => s.id === serviceId) }))
    .filter((c) => !!c.service && c.g.availableSlots.some((s) => s.date === date && s.times.includes(time)))
    .map((c) => ({ g: c.g, service: c.service! }));

  const custAddr = customerAddress.trim();
  const custCoords = custAddr ? await geocodeAddress(custAddr) : null;

  if (!custCoords) {
    return candidates
      .filter((c) => isInServiceAreaEstimate(customerAddress, c.g))
      .map((c) => ({ groomer: c.g, distanceScore: getDistanceScore(customerAddress, c.g.address ?? c.g.area ?? ""), service: c.service }))
      .sort((a, b) => a.distanceScore - b.distanceScore);
  }

  const addrs = Array.from(new Set(candidates.map((c) => (c.g.address ?? c.g.area ?? "").trim()).filter(Boolean)));
  const coordsMap = new Map<string, { lat: number; lng: number } | null>();
  await Promise.all(
    addrs.map(async (addr) => {
      coordsMap.set(addr, await geocodeAddress(addr));
    })
  );

  const results: MatchResult[] = [];
  for (const { g, service } of candidates) {
    const groomerAddr = (g.address ?? g.area ?? "").trim();
    if (!groomerAddr) {
      results.push({ groomer: g, distanceScore: 2, service });
      continue;
    }
    const groomerCoords = coordsMap.get(groomerAddr);
    const inEstimate = isInServiceAreaEstimate(customerAddress, g);
    if (groomerCoords) {
      const km = distanceKm(custCoords.lat, custCoords.lng, groomerCoords.lat, groomerCoords.lng);
      const inRadius = km <= (g.radiusKm ?? 10);
      if (!inRadius && !inEstimate) continue;
      const score = inRadius ? (km <= 5 ? 0 : km <= 15 ? 1 : 2) : getDistanceScore(customerAddress, groomerAddr);
      results.push({ groomer: g, distanceScore: score, service });
    } else if (inEstimate) {
      results.push({ groomer: g, distanceScore: getDistanceScore(customerAddress, groomerAddr), service });
    }
  }
  if (results.length === 0 && candidates.length > 0) {
    return candidates
      .filter((c) => isInServiceAreaEstimate(customerAddress, c.g))
      .map((c) => ({ groomer: c.g, distanceScore: getDistanceScore(customerAddress, c.g.address ?? c.g.area ?? ""), service: c.service }))
      .sort((a, b) => a.distanceScore - b.distanceScore);
  }
  results.sort((a, b) => a.distanceScore - b.distanceScore);
  return results;
}

/** 서비스+고객주소에 맞는 디자이너들의 가능한 (날짜, 시간) 목록 - 동기, 주소 추정 폴백 */
export function getAvailableSlots(
  groomers: GroomerProfile[],
  serviceId: string,
  customerAddress: string,
  daysCount: number = 14
): { date: string; times: string[] }[] {
  const active = filterActiveGroomers(groomers);
  const dateToTimes = new Map<string, Set<string>>();
  const start = new Date();
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    dateToTimes.set(dateStr, new Set());
  }
  for (const g of active) {
    if (!g.services.some((s) => s.id === serviceId)) continue;
    if (!isInServiceAreaEstimate(customerAddress, g)) continue;
    for (const slot of g.availableSlots) {
      const times = dateToTimes.get(slot.date);
      if (times) slot.times.forEach((t) => times.add(t));
    }
  }
  return Array.from(dateToTimes.entries())
    .filter(([, times]) => times.size > 0)
    .map(([date, times]) => ({ date, times: Array.from(times).sort() }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** 주소 기반으로 서비스 가능 디자이너 필터 (지오코딩 없이) */
function getInRangeGroomersByAddress(
  candidates: GroomerProfile[],
  customerAddress: string
): GroomerProfile[] {
  return candidates.filter((g) => {
    const addr = (g.address ?? g.area ?? "").trim();
    return !addr || isInServiceAreaEstimate(customerAddress, g);
  });
}

/** 서비스+고객주소에 맞는 디자이너들의 가능한 (날짜, 시간) 목록 - 지도 API 기반, 병렬 geocoding */
export async function getAvailableSlotsWithGeocode(
  groomers: GroomerProfile[],
  serviceId: string,
  customerAddress: string,
  daysCount: number = 14
): Promise<{ date: string; times: string[] }[]> {
  const candidates = filterActiveGroomers(groomers).filter((g) => g.services.some((s) => s.id === serviceId));
  const custAddr = customerAddress.trim();

  let inRangeGroomers: GroomerProfile[] = getInRangeGroomersByAddress(candidates, customerAddress);

  if (custAddr) {
    const custCoords = await geocodeAddress(custAddr);
    if (custCoords) {
      const addrs = Array.from(new Set(candidates.map((g) => (g.address ?? g.area ?? "").trim()).filter(Boolean)));
      const coordsMap = new Map<string, { lat: number; lng: number } | null>();
      await Promise.all(addrs.map(async (addr) => { coordsMap.set(addr, await geocodeAddress(addr)); }));

      const byGeocode = candidates.filter((g) => {
        const addr = (g.address ?? g.area ?? "").trim();
        if (!addr) return true;
        const coords = coordsMap.get(addr);
        if (coords) {
          const km = distanceKm(custCoords.lat, custCoords.lng, coords.lat, coords.lng);
          const inRadius = km <= (g.radiusKm ?? 10);
          const inEstimate = isInServiceAreaEstimate(customerAddress, g);
          return inRadius || inEstimate;
        }
        return isInServiceAreaEstimate(customerAddress, g);
      });
      const merged = new Map(inRangeGroomers.map((g) => [g.id, g]));
      byGeocode.forEach((g) => merged.set(g.id, g));
      inRangeGroomers = Array.from(merged.values());
    }
  }

  const dateToTimes = new Map<string, Set<string>>();
  const start = new Date();
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    dateToTimes.set(dateStr, new Set());
  }
  for (const g of inRangeGroomers) {
    for (const slot of g.availableSlots) {
      const times = dateToTimes.get(slot.date);
      if (times) slot.times.forEach((t) => times.add(t));
    }
  }
  return Array.from(dateToTimes.entries())
    .filter(([, times]) => times.size > 0)
    .map(([date, times]) => ({ date, times: Array.from(times).sort() }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
