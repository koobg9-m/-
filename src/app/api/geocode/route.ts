import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Kakao 주소 검색 API로 좌표 조회 */
async function geocodeKakaoAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
    { headers: { Authorization: `KakaoAK ${key}` } }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const doc = json?.documents?.[0];
  if (!doc?.y || !doc?.x) return null;
  return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
}

/** Kakao 키워드 검색 API로 역/장소명 좌표 조회 (주소 검색 실패 시 폴백) */
async function geocodeKakaoKeyword(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(address)}`,
    { headers: { Authorization: `KakaoAK ${key}` } }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const doc = json?.documents?.[0];
  if (!doc?.y || !doc?.x) return null;
  return { lat: parseFloat(doc.y), lng: parseFloat(doc.x) };
}

/** Google Maps Geocoding API로 좌표 조회 */
async function geocodeGoogle(address: string): Promise<{ lat: number; lng: number } | null> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=kr&key=${key}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const loc = json?.results?.[0]?.geometry?.location;
  if (!loc?.lat || !loc?.lng) return null;
  return { lat: parseFloat(loc.lat), lng: parseFloat(loc.lng) };
}

/** Naver 지도 Geocoding API로 좌표 조회 */
async function geocodeNaver(address: string): Promise<{ lat: number; lng: number } | null> {
  const clientId = process.env.NAVER_MAPS_CLIENT_ID;
  const clientSecret = process.env.NAVER_MAPS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const res = await fetch(
    `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`,
    {
      headers: {
        "x-ncp-apigw-api-key-id": clientId,
        "x-ncp-apigw-api-key": clientSecret,
      },
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const addr = json?.addresses?.[0];
  if (!addr?.y || !addr?.x) return null;
  return { lat: parseFloat(addr.y), lng: parseFloat(addr.x) };
}

const hasGeocodeConfig = () =>
  !!(process.env.KAKAO_REST_API_KEY || (process.env.NAVER_MAPS_CLIENT_ID && process.env.NAVER_MAPS_CLIENT_SECRET) || process.env.GOOGLE_MAPS_API_KEY);

/** 주소 정규화 - 지오코딩 API 인식률 향상 (서울→서울특별시 등) */
function normalizeAddressForGeocode(addr: string): string {
  return addr
    .replace(/\b서울\b/g, "서울특별시")
    .replace(/\b부산\b/g, "부산광역시")
    .replace(/\b대구\b/g, "대구광역시")
    .replace(/\b인천\b/g, "인천광역시")
    .replace(/\b광주\b/g, "광주광역시")
    .replace(/\b대전\b/g, "대전광역시")
    .replace(/\b울산\b/g, "울산광역시")
    .trim();
}

/** 시/도로 보이는지 (서울, 경기, 부산 등) */
const SI_DO_PATTERN = /^(서울|경기|인천|부산|대구|광주|대전|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주)(특별시|광역시|도|특별자치시|특별자치도)?$/;

function getAddressParts(addr: string): string[] {
  return addr.trim().split(/\s+/).filter(Boolean).slice(0, 4);
}

/** 주소 → 좌표 변환 (Kakao 우선, 주소 실패 시 키워드 검색, 없으면 Naver) */
async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;
  const normalized = normalizeAddressForGeocode(trimmed);
  if (process.env.KAKAO_REST_API_KEY) {
    let r = await geocodeKakaoAddress(normalized);
    if (!r && !SI_DO_PATTERN.test(getAddressParts(normalized)[0] || "")) {
      const withSeoul = `서울특별시 ${normalized}`;
      r = await geocodeKakaoAddress(withSeoul);
    }
    if (!r) r = await geocodeKakaoKeyword(normalized);
    if (!r && !SI_DO_PATTERN.test(getAddressParts(normalized)[0] || "")) {
      r = await geocodeKakaoKeyword(`서울 ${normalized}`);
    }
    if (r) return r;
  }
  if (process.env.NAVER_MAPS_CLIENT_ID && process.env.NAVER_MAPS_CLIENT_SECRET) {
    const r = await geocodeNaver(normalized);
    if (r) return r;
  }
  if (process.env.GOOGLE_MAPS_API_KEY) {
    const r = await geocodeGoogle(normalized);
    if (r) return r;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const address = req.nextUrl.searchParams.get("address");
    if (!address) {
      return NextResponse.json({ error: "address required" }, { status: 400 });
    }
    if (!hasGeocodeConfig()) {
      return NextResponse.json({ error: "geocode not configured" }, { status: 503 });
    }
    const coords = await geocode(address);
    if (!coords) {
      return NextResponse.json({ error: "geocode failed" }, { status: 404 });
    }
    return NextResponse.json(coords);
  } catch (e) {
    console.error("[geocode]", e);
    return NextResponse.json({ error: "geocode error" }, { status: 500 });
  }
}
