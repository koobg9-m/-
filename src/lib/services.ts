"use client";

import { fetchData, saveData } from "./data-sync";

/** 견종 구분 (요금표 기준) */
export type BreedType = "소형견" | "중형견" | "특수견";

/** 체중 구간 (요금표 기준) */
export type WeightTier =
  | "3kg미만"
  | "5kg미만"
  | "7kg미만"
  | "9kg미만"
  | "11kg미만"
  | "13kg미만";

/** 서비스 ID (요금표 6개 서비스) */
export const SERVICE_IDS = [
  "bathOnly",       // 목욕+위생미용 (소형견만)
  "bathFace",       // 위생+목욕+얼굴컷
  "fullClip",       // 전체클리핑(올빡)
  "fullClipFace",   // 전체클리핑+얼굴컷
  "bodyClipScissor", // 몸클리핑+가위컷(스포팅,다리장식)
  "fullScissor",    // 전체가위컷
] as const;

/** 요금표 기반 서비스 정의 */
export const SERVICE_DEFS = [
  { id: "bathOnly", name: "목욕+위생미용", description: "목욕, 위생미용", duration: 60, forBreed: ["소형견"] as const },
  { id: "bathFace", name: "위생+목욕+얼굴컷", description: "위생미용, 목욕, 얼굴컷", duration: 70, forBreed: ["소형견", "중형견", "특수견"] as const },
  { id: "fullClip", name: "전체클리핑(올빡)", description: "클리퍼를 이용한 전체 털 정리", duration: 90, forBreed: ["소형견", "중형견", "특수견"] as const },
  { id: "fullClipFace", name: "전체클리핑+얼굴컷", description: "전체클리핑 + 얼굴 스타일링", duration: 90, forBreed: ["소형견", "중형견", "특수견"] as const },
  { id: "bodyClipScissor", name: "몸클리핑+가위컷", description: "스포팅, 다리장식 포함", duration: 100, forBreed: ["소형견", "중형견", "특수견"] as const },
  { id: "fullScissor", name: "전체가위컷", description: "가위를 이용한 전체 스타일링", duration: 110, forBreed: ["소형견", "중형견", "특수견"] as const },
] as const;

/** 요금표 기본 가격 [견종][체중구간] = 가격 (소형견 4단계, 중형/특수 6단계) */
export const DEFAULT_PRICE_TABLE: Record<BreedType, Record<string, Record<string, number>>> = {
  소형견: {
    bathOnly: { "3kg미만": 45000, "5kg미만": 50000, "7kg미만": 55000, "9kg미만": 60000 },
    bathFace: { "3kg미만": 55000, "5kg미만": 60000, "7kg미만": 70000, "9kg미만": 80000 },
    fullClip: { "3kg미만": 55000, "5kg미만": 60000, "7kg미만": 70000, "9kg미만": 80000 },
    fullClipFace: { "3kg미만": 60000, "5kg미만": 65000, "7kg미만": 75000, "9kg미만": 85000 },
    bodyClipScissor: { "3kg미만": 80000, "5kg미만": 85000, "7kg미만": 95000, "9kg미만": 105000 },
    fullScissor: { "3kg미만": 95000, "5kg미만": 100000, "7kg미만": 110000, "9kg미만": 120000 },
  },
  중형견: {
    bathFace: { "3kg미만": 45000, "5kg미만": 50000, "7kg미만": 55000, "9kg미만": 60000, "11kg미만": 65000, "13kg미만": 70000 },
    fullClip: { "3kg미만": 60000, "5kg미만": 65000, "7kg미만": 75000, "9kg미만": 85000, "11kg미만": 95000, "13kg미만": 105000 },
    fullClipFace: { "3kg미만": 60000, "5kg미만": 65000, "7kg미만": 75000, "9kg미만": 85000, "11kg미만": 95000, "13kg미만": 105000 },
    bodyClipScissor: { "3kg미만": 65000, "5kg미만": 70000, "7kg미만": 80000, "9kg미만": 90000, "11kg미만": 100000, "13kg미만": 110000 },
    fullScissor: { "3kg미만": 100000, "5kg미만": 105000, "7kg미만": 115000, "9kg미만": 125000, "11kg미만": 135000, "13kg미만": 145000 },
  },
  특수견: {
    bathFace: { "3kg미만": 45000, "5kg미만": 50000, "7kg미만": 55000, "9kg미만": 60000, "11kg미만": 65000, "13kg미만": 65000 },
    fullClip: { "3kg미만": 60000, "5kg미만": 65000, "7kg미만": 75000, "9kg미만": 85000, "11kg미만": 95000, "13kg미만": 105000 },
    fullClipFace: { "3kg미만": 60000, "5kg미만": 65000, "7kg미만": 75000, "9kg미만": 85000, "11kg미만": 95000, "13kg미만": 105000 },
    bodyClipScissor: { "3kg미만": 65000, "5kg미만": 70000, "7kg미만": 80000, "9kg미만": 90000, "11kg미만": 100000, "13kg미만": 110000 },
    fullScissor: { "3kg미만": 100000, "5kg미만": 110000, "7kg미만": 120000, "9kg미만": 130000, "11kg미만": 140000, "13kg미만": 150000 },
  },
};


/** 추가사항(추가요금) 항목 */
export type AdditionalFeeItem = {
  id: string;
  name: string;
  price: number;
  description?: string;
  /** 견종별 가격 (없으면 price 적용) */
  prices?: Record<BreedType, number>;
};

/** 기본 추가사항 목록 */
export const DEFAULT_ADDITIONAL_FEES: AdditionalFeeItem[] = [
  { id: "style_face", name: "스타일 얼굴컷", price: 5000, description: "스타일링 얼굴컷" },
  { id: "tangled", name: "엉킴", price: 5000, description: "확인 후 엉킴 정도에 따라 추가금 발생" },
  { id: "health", name: "지병", price: 5000, description: "뇌, 심장, 보행불가 등" },
  { id: "long_hair", name: "기장 1cm이상", price: 10000, description: "모량에 따라 추가금 발생" },
  { id: "senior", name: "노령견", price: 10000, description: "10살 이상" },
  { id: "aggressive", name: "사나움", price: 10000, description: "방문시 확인 후 정도에 따라 추가금 발생" },
  { id: "aggressive_heavy", name: "엉킴/사나움 (특수견)", price: 20000, description: "특수견 기준" },
];

export const ADDITIONAL_FEES_KEY = "mimi_additional_fees";

export function getAdditionalFees(): AdditionalFeeItem[] {
  if (typeof window === "undefined") return DEFAULT_ADDITIONAL_FEES;
  try {
    const raw = localStorage.getItem(ADDITIONAL_FEES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_ADDITIONAL_FEES;
  } catch {
    return DEFAULT_ADDITIONAL_FEES;
  }
}

export function saveAdditionalFees(fees: AdditionalFeeItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADDITIONAL_FEES_KEY, JSON.stringify(fees));
  void saveData(ADDITIONAL_FEES_KEY, fees);
}

/** 추가요금 항목의 가격 (견종별 가격 있으면 사용, 없으면 price) */
export function getAdditionalFeePrice(fee: AdditionalFeeItem, breedType?: BreedType): number {
  if (fee.prices && breedType && fee.prices[breedType] != null) return fee.prices[breedType];
  return fee.price;
}

export const SERVICE_PRICES_KEY = "mimi_service_prices";

export type WeightPrices = { 소형: number; 중형: number; 대형: number }; // 하위호환

/** 관리자용 기본 가격 (소형=5kg, 중형=9kg, 대형=13kg 근사) */
export function getDefaultWeightPrices(serviceId: string): WeightPrices {
  const sb = DEFAULT_PRICE_TABLE.소형견 as Record<string, Record<string, number>>;
  const mb = DEFAULT_PRICE_TABLE.중형견 as Record<string, Record<string, number>>;
  const s5 = sb[serviceId]?.["5kg미만"];
  const s9 = sb[serviceId]?.["9kg미만"];
  const m9 = mb[serviceId]?.["9kg미만"];
  const m13 = mb[serviceId]?.["13kg미만"];
  return {
    소형: s5 ?? s9 ?? 0,
    중형: s9 ?? m9 ?? s5 ?? 0,
    대형: m13 ?? m9 ?? s9 ?? 0,
  };
}

/** 관리자 설정 가격 조회 (serviceId_breedType_weightTier 형태) */
export function getServicePrices(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SERVICE_PRICES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveServicePrices(prices: Record<string, number>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SERVICE_PRICES_KEY, JSON.stringify(prices));
  void saveData(SERVICE_PRICES_KEY, prices);
}

export const SERVICE_PRICES_LEGACY_KEY = "mimi_service_prices_legacy";

/** 관리자 3단계(소형/중형/대형) 오버라이드 조회 */
export function getServicePricesLegacy(): Record<string, WeightPrices> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SERVICE_PRICES_LEGACY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** 관리자 3단계 오버라이드 저장 */
export function saveServicePricesLegacy(prices: Record<string, WeightPrices>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SERVICE_PRICES_LEGACY_KEY, JSON.stringify(prices));
  void saveData(SERVICE_PRICES_LEGACY_KEY, prices);
}

/** Supabase에서 요금·추가요금 불러오기 */
export async function hydrateServicesFromRemote(): Promise<void> {
  if (typeof window === "undefined") return;
  const [fees, prices, legacy] = await Promise.all([
    fetchData<AdditionalFeeItem[]>(ADDITIONAL_FEES_KEY),
    fetchData<Record<string, number>>(SERVICE_PRICES_KEY),
    fetchData<Record<string, WeightPrices>>(SERVICE_PRICES_LEGACY_KEY),
  ]);
  if (fees != null && Array.isArray(fees)) {
    localStorage.setItem(ADDITIONAL_FEES_KEY, JSON.stringify(fees));
  }
  if (prices != null && typeof prices === "object") {
    localStorage.setItem(SERVICE_PRICES_KEY, JSON.stringify(prices));
  }
  if (legacy != null && typeof legacy === "object") {
    localStorage.setItem(SERVICE_PRICES_LEGACY_KEY, JSON.stringify(legacy));
  }
}

/** weightTier → 소형/중형/대형 근사 (관리자 레거시용) */
function tierToWeightRange(tier: WeightTier): "소형" | "중형" | "대형" {
  if (tier === "3kg미만" || tier === "5kg미만") return "소형";
  if (tier === "7kg미만" || tier === "9kg미만") return "중형";
  return "대형";
}

/** 요금표 기반 가격 조회 */
export function getServicePrice(
  serviceId: string,
  breedType: BreedType,
  weightTier: WeightTier
): number {
  const overrides = getServicePrices();
  const key = `${serviceId}_${breedType}_${weightTier}`;
  if (overrides[key] != null) return overrides[key];
  const legacy = getServicePricesLegacy()[serviceId];
  if (legacy) {
    const wr = tierToWeightRange(weightTier);
    if (legacy[wr] != null) return legacy[wr];
  }
  const breedTable = DEFAULT_PRICE_TABLE[breedType] as Record<string, Record<string, number>>;
  const servicePrices = breedTable[serviceId];
  if (!servicePrices) return 0;
  return servicePrices[weightTier] ?? Object.values(servicePrices)[0] ?? 0;
}

/** 체중(kg) → 체중구간 변환 */
export function weightToTier(weightKg: number, breedType: BreedType): WeightTier {
  const tiers: WeightTier[] =
    breedType === "소형견"
      ? ["3kg미만", "5kg미만", "7kg미만", "9kg미만"]
      : ["3kg미만", "5kg미만", "7kg미만", "9kg미만", "11kg미만", "13kg미만"];
  if (weightKg < 3) return "3kg미만";
  if (weightKg < 5) return "5kg미만";
  if (weightKg < 7) return "7kg미만";
  if (weightKg < 9) return "9kg미만";
  if (breedType === "소형견") return "9kg미만";
  if (weightKg < 11) return "11kg미만";
  return "13kg미만";
}

/** 기존 weightRange(소형/중형/대형) → breedType + weightTier 근사 */
export function weightRangeToBreedAndTier(
  weightRange?: string,
  weightKg?: number
): { breedType: BreedType; weightTier: WeightTier } {
  const breedType: BreedType = "소형견";
  if (weightKg != null) {
    return { breedType, weightTier: weightToTier(weightKg, breedType) };
  }
  const tierMap: Record<string, WeightTier> = {
    소형: "5kg미만",
    중형: "9kg미만",
    대형: "13kg미만",
  };
  return { breedType, weightTier: tierMap[weightRange ?? ""] ?? "5kg미만" };
}

export function getServiceDef(serviceId: string) {
  return SERVICE_DEFS.find((s) => s.id === serviceId) ?? null;
}

/** 견종에 제공되는 서비스 목록 */
export function getServicesForBreed(breedType: BreedType) {
  return SERVICE_DEFS.filter((s) => (s.forBreed as readonly BreedType[]).includes(breedType));
}

export function getServicesForPet(_species: string, _weightRange?: string) {
  return SERVICE_DEFS;
}

/** 하위 호환: 소형/중형/대형 → getServicePrice (소형견 기준, 5/9/13kg) */
export function getServicePriceLegacy(
  serviceId: string,
  weightRange: "소형" | "중형" | "대형"
): number {
  const tier = weightRange === "소형" ? "5kg미만" : weightRange === "중형" ? "9kg미만" : "13kg미만";
  return getServicePrice(serviceId, "소형견", tier);
}

export const SERVICES = SERVICE_DEFS;

export const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00",
];
