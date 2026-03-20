"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getBookings, getGroomerProfiles, updateGroomer, updateBooking } from "@/lib/groomer-storage";
import { SERVICE_DEFS, getServicePrices, saveServicePrices, getServicePricesLegacy, getAdditionalFees, saveAdditionalFees, DEFAULT_ADDITIONAL_FEES, DEFAULT_PRICE_TABLE, hydrateServicesFromRemote, type BreedType, type WeightTier, type AdditionalFeeItem } from "@/lib/services";
import { hashPassword, verifyPassword } from "@/lib/auth-utils";
import { clearAdminAuthCookie, hasAdminAuthCookie } from "@/lib/admin-auth-cookie";
import { getAdminSettings, getAdminSettingsAsync, saveAdminSettings, hydrateAdminSettingsFromRemote, calcCommission, calcSettlementAmount, getServiceTotalForSettlement } from "@/lib/admin-settings";
import { getSyncStatus } from "@/lib/data-sync";
import { downloadSettlementExcel } from "@/lib/settlement-excel";
import { checkAndSendGroomingReminders } from "@/lib/grooming-reminder";
import { getPointSettings, savePointSettings, getCustomerPoints, setCustomerPoints, hydratePointsFromRemote, type PointSettings } from "@/lib/point-storage";
import { getSmsTemplates, saveSmsTemplates, getSmsLog, addSmsLog, fillTemplate, hydrateNotificationFromRemote, type SmsTemplate } from "@/lib/notification-storage";
import { hydrateHomepageFromRemote } from "@/lib/homepage-content-storage";
import { hydrateTipsNoticesFromRemote } from "@/lib/tips-notices-storage";
import { pushLocalAppDataToServer } from "@/lib/push-local-app-data-to-server";
import { getAdminPasswordHash, saveAdminPasswordHash } from "@/lib/admin-password-hash";
import type { GroomerProfile } from "@/lib/groomer-types";
import AdminHomepageEditor from "@/components/admin/AdminHomepageEditor";
import AdminLocalBackupCard from "@/components/admin/AdminLocalBackupCard";
import StarRating from "@/components/common/StarRating";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

const ADMIN_AUTH_KEY = "mimi_admin_authenticated";

type PetInfo = { name: string; species: string; healthConditions?: string; isAggressive?: boolean };
type Booking = {
  id: string;
  groomerId?: string;
  groomerName?: string;
  serviceId?: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
  petName: string;
  petType: string;
  pets?: PetInfo[];
  address: string;
  customerName?: string;
  phone?: string;
  customerPhone?: string;
  customerEmail?: string;
  status: string;
  createdAt: string;
  customerNotifiedAt?: string;
  settlementStatus?: string;
  additionalFees?: { id: string; name: string; price: number }[];
  beforePhotos?: string[];
  afterPhotos?: string[];
  reviewRating?: number;
  reviewText?: string;
  reviewAt?: string;
  settlementRequestedAt?: string;
};

function getStatusLabel(s: string): string {
  const map: Record<string, string> = { pending: "대기", paid: "결제완료", confirmed: "예약확정", completed: "서비스완료", cancelled: "취소" };
  return map[s] ?? s;
}

function formatPets(b: Booking): string {
  if (b.pets?.length) {
    return b.pets.map((p) => `${p.name} (${p.species})`).join(", ");
  }
  return `${b.petName} (${b.petType})`;
}

/** CSS 바 차트 (max값 대비 비율) */
function BarChart({ data, maxHeight = 120 }: { data: { label: string; value: number; color?: string }[]; maxHeight?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-20 text-sm text-gray-600 shrink-0">{d.label}</span>
          <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-full rounded transition-all"
              style={{
                width: `${(d.value / max) * 100}%`,
                backgroundColor: d.color ?? "var(--mimi-orange, #f97316)",
              }}
            />
          </div>
          <span className="text-sm font-medium w-16 text-right">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

/** 금액 바 차트 */
function AmountBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-24 text-sm text-gray-600 shrink-0">{d.label}</span>
          <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
            <div
              className="h-full bg-mimi-orange rounded transition-all"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
          <span className="text-sm font-medium w-20 text-right">{d.value.toLocaleString()}원</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [groomers, setGroomers] = useState<GroomerProfile[]>([]);
  const [tab, setTab] = useState<"dashboard" | "homepage" | "groomers" | "customers" | "time" | "bookings" | "settlement" | "prices" | "points" | "settings">("dashboard");
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [pricesSaved, setPricesSaved] = useState(false);
  const [settings, setSettings] = useState(() => getAdminSettings());
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [pwChangeCurrent, setPwChangeCurrent] = useState("");
  const [pwChangeNew, setPwChangeNew] = useState("");
  const [pwChangeConfirm, setPwChangeConfirm] = useState("");
  const [pwChangeMsg, setPwChangeMsg] = useState("");
  const [smsTemplates, setSmsTemplates] = useState<SmsTemplate[]>([]);
  const [smsLog, setSmsLog] = useState<ReturnType<typeof getSmsLog>>([]);
  const [smsSendTo, setSmsSendTo] = useState("");
  const [smsSendBody, setSmsSendBody] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [bookingsFilterGroomer, setBookingsFilterGroomer] = useState<string>("all");
  const [bookingsFilterStatus, setBookingsFilterStatus] = useState<string>("all");
  const [bookingsFilterDateFrom, setBookingsFilterDateFrom] = useState("");
  const [bookingsFilterDateTo, setBookingsFilterDateTo] = useState("");
  const [settlementFilterGroomer, setSettlementFilterGroomer] = useState<string>("all");
  const [additionalFees, setAdditionalFees] = useState<AdditionalFeeItem[]>([]);
  const [groomersRefresh, setGroomersRefresh] = useState(0);
  const [pointSettings, setPointSettings] = useState<PointSettings>(() => getPointSettings());
  const [pointSettingsSaved, setPointSettingsSaved] = useState(false);
  const [customerFilterRegion, setCustomerFilterRegion] = useState<string>("all");
  const [customerFilterVisit, setCustomerFilterVisit] = useState<string>("all");
  const [customerSort, setCustomerSort] = useState<"visits" | "recent" | "amount" | "name">("visits");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerKeys, setSelectedCustomerKeys] = useState<Set<string>>(new Set());
  const [smsBulkTemplateId, setSmsBulkTemplateId] = useState<string>("");
  const [groomerPwModal, setGroomerPwModal] = useState<{ id: string; name: string } | null>(null);
  const [groomerPwInput, setGroomerPwInput] = useState("");
  const [groomerPwError, setGroomerPwError] = useState("");
  const [groomerSearch, setGroomerSearch] = useState("");
  const [groomerFilterStatus, setGroomerFilterStatus] = useState<string>("all");
  const [groomerFilterRegion, setGroomerFilterRegion] = useState<string>("all");
  const [groomerFilterDateFrom, setGroomerFilterDateFrom] = useState("");
  const [groomerFilterDateTo, setGroomerFilterDateTo] = useState("");
  const [groomerFilterRadius, setGroomerFilterRadius] = useState<string>("all");
  const [groomerFilterAccount, setGroomerFilterAccount] = useState<string>("all");
  const [groomerFilterVisits, setGroomerFilterVisits] = useState<string>("all");
  const [groomerFilterRating, setGroomerFilterRating] = useState<string>("all");
  const [groomerFilterPassword, setGroomerFilterPassword] = useState<string>("all");
  const [groomerSort, setGroomerSort] = useState<"visits" | "rating" | "name" | "recent">("visits");
  const [groomerDetailModal, setGroomerDetailModal] = useState<{ g: GroomerProfile; completed: number; avgRating: string | null; reviews: number } | null>(null);
  const [groomerSmsBody, setGroomerSmsBody] = useState("");
  const [syncStatus, setSyncStatus] = useState<{ ok: boolean; configured: boolean; error?: string } | null>(null);
  const [serverRefreshLoading, setServerRefreshLoading] = useState(false);
  /** Supabase에서 관리자 데이터 불러온 뒤 요금·포인트·SMS UI 갱신 */
  const [adminDataRevision, setAdminDataRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let t: ReturnType<typeof setTimeout>;
    (async () => {
      try {
        if (typeof window === "undefined") {
          setAuthChecked(true);
          return;
        }
        const hash = await getAdminPasswordHash();
        if (cancelled) return;
        const auth = sessionStorage.getItem(ADMIN_AUTH_KEY);
        const hasCookie = hasAdminAuthCookie();
        setAuthenticated(!!hash && (auth === "1" || hasCookie));
        if (hasCookie && auth !== "1") sessionStorage.setItem(ADMIN_AUTH_KEY, "1");
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setAuthChecked(true);
      }
    })();
    t = setTimeout(() => {
      if (!cancelled) setAuthChecked(true);
    }, 1500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    Promise.all([getBookings(), getGroomerProfiles()]).then(([bList, gList]) => {
      setBookings(bList);
      setGroomers(gList);
    }).catch(() => {});
  }, [tab, groomersRefresh]);

  useEffect(() => {
    getSyncStatus().then(setSyncStatus);
  }, []);

  /** 로그인 후·Supabase 연동 시 요금·포인트·SMS·플랫폼 설정을 서버와 맞춤 */
  useEffect(() => {
    if (!authChecked || !authenticated) return;
    (async () => {
      await Promise.all([
        hydrateServicesFromRemote(),
        hydratePointsFromRemote(),
        hydrateNotificationFromRemote(),
        hydrateAdminSettingsFromRemote(),
      ]);
      const s = await getAdminSettingsAsync();
      setSettings(s);
      setAdminDataRevision((r) => r + 1);
    })().catch(() => {});
  }, [authChecked, authenticated]);

  useEffect(() => {
    if (tab === "customers") {
      setSmsTemplates(getSmsTemplates());
      setSmsLog(getSmsLog());
    }
  }, [tab, adminDataRevision]);

  useEffect(() => {
    if (tab === "settings") {
      getAdminSettingsAsync().then(setSettings);
    } else {
      setSettings(getAdminSettings());
    }
  }, [tab]);

  useEffect(() => {
    const saved = getServicePrices();
    const legacy = getServicePricesLegacy();
    const merged: Record<string, number> = {};
    const tierToLegacy: Record<string, "소형" | "중형" | "대형"> = {
      "3kg미만": "소형", "5kg미만": "소형", "7kg미만": "중형", "9kg미만": "중형",
      "11kg미만": "대형", "13kg미만": "대형",
    };
    for (const breedType of ["소형견", "중형견", "특수견"] as BreedType[]) {
      const breedTable = DEFAULT_PRICE_TABLE[breedType] as Record<string, Record<string, number>>;
      for (const serviceId of Object.keys(breedTable)) {
        const tiers = breedTable[serviceId];
        if (!tiers) continue;
        for (const weightTier of Object.keys(tiers) as WeightTier[]) {
          const key = `${serviceId}_${breedType}_${weightTier}`;
          const fromNew = saved[key];
          const fromLegacy = legacy[serviceId]?.[tierToLegacy[weightTier]];
          const fromDefault = tiers[weightTier];
          merged[key] = fromNew ?? fromLegacy ?? fromDefault ?? 0;
        }
      }
    }
    setPrices(merged);
  }, [tab, adminDataRevision]);

  useEffect(() => {
    if (tab === "prices") setAdditionalFees(getAdditionalFees());
  }, [tab, adminDataRevision]);

  useEffect(() => {
    if (tab === "points") setPointSettings(getPointSettings());
  }, [tab, adminDataRevision]);

  useEffect(() => {
    if (authChecked && authenticated === false) {
      router.replace("/admin/login");
    }
  }, [authChecked, authenticated, router]);

  /** 미용 추천 리마인더: 관리자 페이지 로드 시 1주일 전 자동 발송 대상 확인 */
  useEffect(() => {
    if (!authChecked || !authenticated) return;
    checkAndSendGroomingReminders().then(({ sent }) => {
      if (sent > 0) {
        getBookings().then(setBookings);
        setSmsLog(getSmsLog());
      }
    }).catch(() => {});
  }, [authChecked, authenticated]);

  /** 자동 저장: 요금 (1.5초 디바운스) */
  useEffect(() => {
    if (Object.keys(prices).length === 0) return;
    const t = setTimeout(() => {
      saveServicePrices(prices);
      setPricesSaved(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [prices]);

  /** 자동 저장: 설정 (1.5초 디바운스) */
  useEffect(() => {
    const t = setTimeout(() => {
      saveAdminSettings(settings);
      setSettingsSaved(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [settings]);

  /** 자동 저장: 포인트 설정 (1.5초 디바운스) */
  useEffect(() => {
    if (tab !== "points") return;
    const t = setTimeout(() => {
      savePointSettings(pointSettings);
      setPointSettingsSaved(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [pointSettings, tab]);

  /** 자동 저장: 추가사항 (1.5초 디바운스) */
  useEffect(() => {
    if (tab !== "prices") return;
    const t = setTimeout(() => {
      saveAdditionalFees(additionalFees);
      setPricesSaved(true);
    }, 1500);
    return () => clearTimeout(t);
  }, [additionalFees, tab]);

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    clearAdminAuthCookie();
    router.replace("/admin/login");
  };

  const handleSaveSettings = () => {
    saveAdminSettings(settings);
    setSettingsSaved(true);
  };

  const handlePasswordChange = async () => {
    setPwChangeMsg("");
    const hash = await getAdminPasswordHash();
    if (!hash) return;
    const ok = await verifyPassword(pwChangeCurrent, hash);
    if (!ok) {
      setPwChangeMsg("현재 비밀번호가 올바르지 않습니다.");
      return;
    }
    if (pwChangeNew.length < 6) {
      setPwChangeMsg("새 비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (pwChangeNew !== pwChangeConfirm) {
      setPwChangeMsg("새 비밀번호가 일치하지 않습니다.");
      return;
    }
    const newHash = await hashPassword(pwChangeNew);
    await saveAdminPasswordHash(newHash);
    setPwChangeMsg("비밀번호가 변경되었습니다.");
    setPwChangeCurrent("");
    setPwChangeNew("");
    setPwChangeConfirm("");
  };

  const handlePriceChange = (serviceId: string, breedType: BreedType, weightTier: WeightTier, value: number) => {
    const key = `${serviceId}_${breedType}_${weightTier}`;
    setPrices((prev) => ({ ...prev, [key]: value }));
    setPricesSaved(false);
  };

  const getPrice = (serviceId: string, breedType: BreedType, weightTier: WeightTier): number => {
    const key = `${serviceId}_${breedType}_${weightTier}`;
    return prices[key] ?? (DEFAULT_PRICE_TABLE[breedType] as Record<string, Record<string, number>>)[serviceId]?.[weightTier] ?? 0;
  };

  const handleSavePrices = () => {
    saveServicePrices(prices);
    setPricesSaved(true);
  };

  const commissionRate = settings.commissionRate ?? 10;
  const pointValueWon = pointSettings.pointValueWon ?? 1;
  const svcTotal = (b: { price: number; pointsUsed?: number; serviceTotal?: number }) => getServiceTotalForSettlement(b, pointValueWon);
  const completedBookings = bookings.filter((b) => b.status === "completed");
  const unsettled = completedBookings.filter((b) => (b.settlementStatus ?? "unsettled") === "unsettled");
  const settled = completedBookings.filter((b) => b.settlementStatus === "settled");
  const totalRevenue = completedBookings.reduce((s, b) => s + svcTotal(b), 0);
  const totalCommission = completedBookings.reduce((s, b) => s + calcCommission(svcTotal(b), commissionRate), 0);
  const unsettledAmount = unsettled.reduce((s, b) => s + calcSettlementAmount(svcTotal(b), commissionRate), 0);
  const settledAmount = settled.reduce((s, b) => s + calcSettlementAmount(svcTotal(b), commissionRate), 0);

  const statusCounts = ["paid", "confirmed", "completed", "cancelled"].map((status) => ({
    label: getStatusLabel(status),
    value: bookings.filter((b) => b.status === status).length,
  })).filter((d) => d.value > 0);

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d;
  });
  const revenueByMonth = last6Months.map((d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const key = `${y}-${m}`;
    const amount = completedBookings
      .filter((b) => b.date?.startsWith(key))
      .reduce((s, b) => s + svcTotal(b), 0);
    return { label: `${m}월`, value: amount };
  });

  const serviceCounts = SERVICE_DEFS.map((s) => ({
    label: s.name,
    value: completedBookings.filter((b) => b.serviceId === s.id || b.serviceName === s.name).length,
  })).filter((d) => d.value > 0);

  const customerKey = (b: Booking) => (b.customerPhone ?? "").trim() || (b.customerEmail ?? "").trim() || "unknown";
  const customerCounts = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce<Record<string, { count: number; name?: string; lastDate?: string }>>((acc, b) => {
      const key = customerKey(b);
      if (!acc[key]) acc[key] = { count: 0, name: b.customerName, lastDate: b.date };
      acc[key].count += 1;
      if ((b.date ?? "") > (acc[key].lastDate ?? "")) acc[key].lastDate = b.date;
      return acc;
    }, {});
  const uniqueCustomers = Object.keys(customerCounts).filter((k) => k !== "unknown").length;
  const customerRegions: Record<string, string> = {};
  for (const b of bookings.filter((b) => b.status !== "cancelled").sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))) {
    const key = customerKey(b);
    if (!customerRegions[key]) {
      customerRegions[key] = (b.address ?? "").split(/\s+/).slice(0, 2).join(" ") || "미입력";
    }
  }
  const regionCounts = Object.values(customerRegions).reduce<Record<string, number>>((acc, r) => {
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});
  const visitDistribution = Object.values(customerCounts).reduce<Record<string, number>>((acc, v) => {
    const band = v.count === 1 ? "1회" : v.count <= 3 ? "2~3회" : v.count <= 5 ? "4~5회" : "6회+";
    acc[band] = (acc[band] ?? 0) + 1;
    return acc;
  }, {});

  /** 고객 상세 리스트 (예약 기반 집계) */
  type CustomerDetail = {
    key: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    region: string;
    visitCount: number;
    totalAmount: number;
    firstDate: string;
    lastDate: string;
    pets: string[];
    services: string[];
    type: "신규" | "재방문" | "VIP";
  };
  const validBookings = bookings.filter((b) => b.status !== "cancelled");
  const customerDetailMap = validBookings.reduce<Record<string, CustomerDetail>>((acc, b) => {
    const key = customerKey(b);
    if (!key || key === "unknown") return acc;
    const region = (b.address ?? "").split(/\s+/).slice(0, 2).join(" ") || "미입력";
    const phone = (b.customerPhone ?? b.phone ?? "").trim();
    const email = (b.customerEmail ?? "").trim();
    const petStr = b.pets?.map((p) => `${p.name}(${p.species ?? b.petType})`).join(", ") ?? `${b.petName}(${b.petType})`;
    if (!acc[key]) {
      acc[key] = {
        key,
        name: b.customerName ?? "",
        phone,
        email,
        address: b.address ?? "",
        region,
        visitCount: 0,
        totalAmount: 0,
        firstDate: b.date ?? "",
        lastDate: b.date ?? "",
        pets: [],
        services: [],
        type: "신규",
      };
    }
    const c = acc[key];
    c.visitCount += 1;
    if (b.status === "completed") c.totalAmount += svcTotal(b);
    if ((b.date ?? "") < c.firstDate) c.firstDate = b.date ?? "";
    if ((b.date ?? "") > c.lastDate) c.lastDate = b.date ?? "";
    if (c.name === "" && b.customerName) c.name = b.customerName;
    if (petStr && !c.pets.includes(petStr)) c.pets.push(petStr);
    const svc = b.serviceName ?? "";
    if (svc && !c.services.includes(svc)) c.services.push(svc);
    c.type = c.visitCount >= 6 ? "VIP" : c.visitCount >= 2 ? "재방문" : "신규";
    return acc;
  }, {});
  let customerList = Object.values(customerDetailMap).filter((c) => c.key !== "unknown");
  if (customerFilterRegion !== "all") {
    customerList = customerList.filter((c) => c.region === customerFilterRegion);
  }
  if (customerFilterVisit !== "all") {
    const [min, max] = customerFilterVisit === "1" ? [1, 1] : customerFilterVisit === "2-3" ? [2, 3] : customerFilterVisit === "4-5" ? [4, 5] : [6, 999];
    customerList = customerList.filter((c) => c.visitCount >= min && c.visitCount <= max);
  }
  if (customerSearch.trim()) {
    const q = customerSearch.trim().toLowerCase();
    customerList = customerList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.replace(/-/g, "").includes(q.replace(/-/g, "")) ||
        c.email.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
    );
  }
  const sortFn =
    customerSort === "visits"
      ? (a: CustomerDetail, b: CustomerDetail) => b.visitCount - a.visitCount
      : customerSort === "recent"
        ? (a: CustomerDetail, b: CustomerDetail) => (b.lastDate ?? "").localeCompare(a.lastDate ?? "")
        : customerSort === "amount"
          ? (a: CustomerDetail, b: CustomerDetail) => b.totalAmount - a.totalAmount
          : (a: CustomerDetail, b: CustomerDetail) => (a.name || a.phone).localeCompare(b.name || b.phone);
  customerList = [...customerList].sort(sortFn);

  const petTypeCounts = bookings.reduce<Record<string, number>>((acc, b) => {
    const types = b.pets?.map((p) => p.species ?? b.petType) ?? [b.petType];
    types.forEach((t) => { acc[t ?? "기타"] = (acc[t ?? "기타"] ?? 0) + 1; });
    return acc;
  }, {});

  const TIME_SLOTS = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
  const timeSlotCounts = TIME_SLOTS.map((t) => ({
    label: t,
    value: bookings.filter((b) => b.time === t || (b.time && b.time.startsWith(t.slice(0, 2)))).length,
  }));
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dayOfWeekCounts = dayNames.map((day, i) => ({
    label: day,
    value: bookings.filter((b) => {
      const d = new Date(b.date + "T12:00:00");
      return d.getDay() === i;
    }).length,
  }));
  const hourlyCounts = Array.from({ length: 24 }, (_, h) => ({
    label: `${h}시`,
    value: bookings.filter((b) => {
      const t = b.time ?? "";
      const hour = parseInt(t.split(":")[0] || "0", 10);
      return hour === h;
    }).length,
  })).filter((d) => d.value > 0);

  const groomerIds = new Set(groomers.map((g) => g.id));
  const bookingsByGroomer = groomers.map((g) => {
    const gBookings = bookings.filter((b) => b.groomerId === g.id);
    const gCompleted = gBookings.filter((b) => b.status === "completed");
    const gReviews = gCompleted.filter((b) => b.reviewRating != null);
    const gAvgRating = gReviews.length > 0
      ? (gReviews.reduce((s, b) => s + (b.reviewRating ?? 0), 0) / gReviews.length).toFixed(1)
      : null;
    const gUnsettled = gCompleted.filter((b) => (b.settlementStatus ?? "unsettled") === "unsettled");
    const gSettled = gCompleted.filter((b) => b.settlementStatus === "settled");
    const gRevenue = gCompleted.reduce((s, b) => s + svcTotal(b), 0);
    const gCommission = gCompleted.reduce((s, b) => s + calcCommission(svcTotal(b), commissionRate), 0);
    const gUnsettledAmount = gUnsettled.reduce((s, b) => s + calcSettlementAmount(svcTotal(b), commissionRate), 0);
    const gSettledAmount = gSettled.reduce((s, b) => s + calcSettlementAmount(svcTotal(b), commissionRate), 0);
    return {
      groomer: g,
      bookings: gBookings,
      completed: gCompleted,
      reviews: gReviews,
      avgRating: gAvgRating,
      unsettled: gUnsettled,
      settled: gSettled,
      revenue: gRevenue,
      commission: gCommission,
      unsettledAmount: gUnsettledAmount,
      settledAmount: gSettledAmount,
    };
  });
  const noGroomerBookings = bookings.filter((b) => !b.groomerId || !groomerIds.has(b.groomerId));
  if (noGroomerBookings.length > 0) {
    bookingsByGroomer.push({
      groomer: { id: "_none", name: "(미지정)", address: "", radiusKm: 10, services: [], availableSlots: [], createdAt: "" },
      bookings: noGroomerBookings,
      completed: noGroomerBookings.filter((b) => b.status === "completed"),
      reviews: [],
      avgRating: null,
      unsettled: [],
      settled: [],
      revenue: 0,
      commission: 0,
      unsettledAmount: 0,
      settledAmount: 0,
    });
  }

  const groomerRegionCounts: Record<string, number> = {};
  for (const g of groomers) {
    const region = (g.address ?? "").split(/\s+/).slice(0, 2).join(" ") || "미입력";
    groomerRegionCounts[region] = (groomerRegionCounts[region] ?? 0) + 1;
  }
  let groomerList = bookingsByGroomer
    .filter((x) => x.groomer.id !== "_none")
    .map(({ groomer, completed, avgRating, reviews }) => ({
      g: groomer as GroomerProfile,
      completed,
      avgRating,
      reviews,
      region: ((groomer as GroomerProfile).address ?? "").split(/\s+/).slice(0, 2).join(" ") || "미입력",
    }));
  if (groomerFilterStatus !== "all") {
    groomerList = groomerList.filter((x) =>
      groomerFilterStatus === "active" ? !x.g.suspended : x.g.suspended
    );
  }
  if (groomerFilterRegion !== "all") {
    groomerList = groomerList.filter((x) => x.region === groomerFilterRegion);
  }
  if (groomerFilterDateFrom) {
    groomerList = groomerList.filter((x) => (x.g.createdAt ?? "").slice(0, 10) >= groomerFilterDateFrom);
  }
  if (groomerFilterDateTo) {
    groomerList = groomerList.filter((x) => (x.g.createdAt ?? "").slice(0, 10) <= groomerFilterDateTo);
  }
  if (groomerFilterRadius !== "all") {
    const r = parseInt(groomerFilterRadius, 10);
    if (!isNaN(r)) groomerList = groomerList.filter((x) => (x.g.radiusKm ?? 10) === r);
  }
  if (groomerFilterAccount !== "all") {
    const hasAccount = (g: GroomerProfile) => !!(g.bankName?.trim() && g.accountNumber?.trim());
    groomerList = groomerList.filter((x) =>
      groomerFilterAccount === "yes" ? hasAccount(x.g) : !hasAccount(x.g)
    );
  }
  if (groomerFilterVisits !== "all") {
    const v = groomerFilterVisits;
    groomerList = groomerList.filter((x) => {
      const n = x.completed.length;
      if (v === "0") return n === 0;
      if (v === "1") return n >= 1;
      if (v === "5") return n >= 5;
      if (v === "10") return n >= 10;
      return true;
    });
  }
  if (groomerFilterRating !== "all") {
    groomerList = groomerList.filter((x) => {
      const rating = parseFloat(x.avgRating ?? "0") || 0;
      if (groomerFilterRating === "none") return rating === 0;
      if (groomerFilterRating === "1") return rating >= 1;
      if (groomerFilterRating === "2") return rating >= 2;
      if (groomerFilterRating === "3") return rating >= 3;
      if (groomerFilterRating === "4") return rating >= 4;
      return true;
    });
  }
  if (groomerFilterPassword !== "all") {
    groomerList = groomerList.filter((x) =>
      groomerFilterPassword === "yes" ? !!(x.g.passwordHash?.trim()) : !(x.g.passwordHash?.trim())
    );
  }
  if (groomerSearch.trim()) {
    const q = groomerSearch.trim().toLowerCase();
    groomerList = groomerList.filter(
      (x) =>
        x.g.name.toLowerCase().includes(q) ||
        (x.g.phone ?? "").toLowerCase().includes(q) ||
        (x.g.email ?? "").toLowerCase().includes(q) ||
        (x.g.address ?? "").toLowerCase().includes(q) ||
        (x.g.career ?? "").toLowerCase().includes(q)
    );
  }
  const groomerSortFn =
    groomerSort === "visits"
      ? (a: typeof groomerList[0], b: typeof groomerList[0]) => b.completed.length - a.completed.length
      : groomerSort === "rating"
        ? (a: typeof groomerList[0], b: typeof groomerList[0]) =>
            (parseFloat(b.avgRating ?? "0") || 0) - (parseFloat(a.avgRating ?? "0") || 0)
        : groomerSort === "name"
          ? (a: typeof groomerList[0], b: typeof groomerList[0]) => a.g.name.localeCompare(b.g.name)
          : (a: typeof groomerList[0], b: typeof groomerList[0]) =>
              (b.g.createdAt ?? "").localeCompare(a.g.createdAt ?? "");
  groomerList = [...groomerList].sort(groomerSortFn);

  const filteredBookings = bookings.filter((b) => {
    if (bookingsFilterGroomer !== "all") {
      if (bookingsFilterGroomer === "_none") {
        if (b.groomerId && groomerIds.has(b.groomerId)) return false;
      } else if (b.groomerId !== bookingsFilterGroomer) {
        return false;
      }
    }
    if (bookingsFilterStatus !== "all" && b.status !== bookingsFilterStatus) return false;
    if (bookingsFilterDateFrom && (b.date ?? "") < bookingsFilterDateFrom) return false;
    if (bookingsFilterDateTo && (b.date ?? "") > bookingsFilterDateTo) return false;
    return true;
  });

  const handleSendSms = (to: string, body: string, bookingId?: string) => {
    const log = {
      id: `S${Date.now()}`,
      to,
      body,
      status: "sent" as const,
      createdAt: new Date().toISOString(),
      bookingId,
    };
    addSmsLog(log);
    setSmsLog(getSmsLog());
    setSmsSendTo("");
    setSmsSendBody("");
  };

  const handleSendSmsBulk = (recipients: { key: string; phone: string; name: string }[], useTemplate?: boolean) => {
    const template = useTemplate && smsBulkTemplateId
      ? smsTemplates.find((t) => t.id === smsBulkTemplateId)
      : null;
    const bodyTemplate = template?.body ?? smsSendBody;
    if (!bodyTemplate.trim()) return;
    const withPhone = recipients.filter((r) => r.phone && /^[\d-]+$/.test(r.phone));
    withPhone.forEach((r) => {
      const filled = fillTemplate(bodyTemplate, {
        customerName: r.name || "고객",
        date: "",
        time: "",
        groomerName: "",
        serviceName: "",
      });
      addSmsLog({
        id: `S${Date.now()}-${r.key}`,
        to: r.phone,
        body: filled,
        status: "sent",
        createdAt: new Date().toISOString(),
      });
    });
    setSmsLog(getSmsLog());
    setSelectedCustomerKeys(new Set());
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex flex-col bg-mimi-cream">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-gray-500">로딩 중...</p>
          <Link href="/admin/login" className="text-sm text-mimi-orange hover:underline">로그인 페이지로 이동</Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (authenticated === false) {
    return (
      <div className="min-h-screen flex flex-col bg-mimi-cream">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <p className="text-gray-500">로그인 페이지로 이동 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  type TabId = "dashboard" | "homepage" | "groomers" | "customers" | "time" | "bookings" | "settlement" | "prices" | "points" | "settings";
  const tabs: { id: TabId; label: string }[] = [
    { id: "dashboard", label: "대시보드" },
    { id: "homepage", label: "홈페이지" },
    { id: "groomers", label: "디자이너 관리" },
    { id: "customers", label: "고객관리" },
    { id: "time", label: "시간분석" },
    { id: "bookings", label: "예약 관리" },
    { id: "settlement", label: "정산" },
    { id: "prices", label: "요금 설정" },
    { id: "points", label: "포인트" },
    { id: "settings", label: "관리 설정" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-mimi-orange transition-colors mb-4">← 홈으로</Link>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
              <h1 className="section-title">관리자</h1>
              <div className="flex flex-wrap gap-2 items-center">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`tab-btn ${tab === t.id ? "tab-btn-active" : "tab-btn-inactive"}`}
                  >
                    {t.label}
                  </button>
                ))}
                <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700 text-sm px-2 py-2">
                  로그아웃
                </button>
              </div>
            </div>

          {tab === "homepage" && (
            <AdminHomepageEditor />
          )}

          {tab === "dashboard" && (
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${!syncStatus ? "bg-gray-100 text-gray-600" : syncStatus.ok ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
                    <span>
                      {!syncStatus
                        ? "연동 확인 중..."
                        : syncStatus.ok
                          ? "✓ 서버 동기화 정상"
                          : syncStatus.configured
                            ? `⚠ ${syncStatus.error ?? "동기화 실패"}`
                            : "Supabase 미설정"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={serverRefreshLoading}
                  onClick={async () => {
                    setServerRefreshLoading(true);
                    try {
                      // 1) 먼저 Supabase → localStorage 반영 후 2) 예약·디자이너·설정 UI 갱신
                      await Promise.all([
                        hydrateHomepageFromRemote(),
                        hydrateTipsNoticesFromRemote(),
                        hydrateServicesFromRemote(),
                        hydratePointsFromRemote(),
                        hydrateNotificationFromRemote(),
                        hydrateAdminSettingsFromRemote(),
                      ]);
                      const [bList, gList] = await Promise.all([getBookings(), getGroomerProfiles()]);
                      setBookings(bList);
                      setGroomers(gList);
                      setSettings(await getAdminSettingsAsync());
                      setAdminDataRevision((r) => r + 1);
                      try {
                        window.dispatchEvent(new CustomEvent("mimi_homepage_updated"));
                        window.dispatchEvent(new CustomEvent("mimi_tips_notices_updated"));
                      } catch {
                        /* ignore */
                      }
                      const status = await getSyncStatus();
                      setSyncStatus(status);
                      setGroomersRefresh((r) => r + 1);
                      alert(
                        "서버에서 새로고침 완료\n\n※ 배포 버전은 코드이고, 화면 내용은 DB+브라우저 저장소입니다. 로컬에서만 바꾼 뒤 저장이 안 됐다면 운영과 다를 수 있습니다. 그럴 땐 옆 버튼「로컬→서버 업로드」를 사용하세요."
                      );
                    } catch (e) {
                      alert(`새로고침 실패: ${e instanceof Error ? e.message : String(e)}`);
                    } finally {
                      setServerRefreshLoading(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {serverRefreshLoading ? "새로고침 중..." : "서버에서 새로고침"}
                </button>
                <button
                  type="button"
                  disabled={serverRefreshLoading}
                  onClick={async () => {
                    if (
                      !confirm(
                        "이 PC 브라우저에 있는 데이터(홈·공지·예약·요금 등)를 Supabase에 올립니다.\n다른 곳(운영 사이트)에 있던 내용은 이 PC 내용으로 덮어씌워질 수 있습니다.\n계속할까요?"
                      )
                    ) {
                      return;
                    }
                    setServerRefreshLoading(true);
                    try {
                      const r = await pushLocalAppDataToServer();
                      const msg = [
                        `업로드: ${r.pushed.length}개 키`,
                        r.skipped.length ? `건너뜀(비어 있음): ${r.skipped.length}개` : "",
                        r.failed.length ? `실패: ${r.failed.join(", ")}` : "",
                      ]
                        .filter(Boolean)
                        .join("\n");
                      alert(msg || "완료");
                      const [bList, gList] = await Promise.all([getBookings(), getGroomerProfiles()]);
                      setBookings(bList);
                      setGroomers(gList);
                      setSettings(await getAdminSettingsAsync());
                      setAdminDataRevision((x) => x + 1);
                      setGroomersRefresh((x) => x + 1);
                      setSyncStatus(await getSyncStatus());
                    } catch (e) {
                      alert(`업로드 실패: ${e instanceof Error ? e.message : String(e)}`);
                    } finally {
                      setServerRefreshLoading(false);
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  로컬→서버 업로드
                </button>
              </div>
              <AdminLocalBackupCard
                onRestored={() => {
                  setAdminDataRevision((r) => r + 1);
                  setGroomersRefresh((r) => r + 1);
                  void getBookings().then(setBookings);
                  void getGroomerProfiles().then(setGroomers);
                  void getAdminSettingsAsync().then(setSettings);
                }}
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card p-5">
                  <p className="text-sm text-gray-500">총 예약</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{bookings.length}건</p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-gray-500">총 매출</p>
                  <p className="text-2xl font-bold text-mimi-orange mt-1">{totalRevenue.toLocaleString()}원</p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-gray-500">수수료 ({commissionRate}%)</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{totalCommission.toLocaleString()}원</p>
                </div>
                <div className="card p-5">
                  <p className="text-sm text-gray-500">등록 디자이너</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{groomers.length}명</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="font-bold text-gray-800 mb-4">예약 상태별</h3>
                  {statusCounts.length > 0 ? (
                    <BarChart data={statusCounts} />
                  ) : (
                    <p className="text-sm text-gray-500">데이터 없음</p>
                  )}
                </div>
                <div className="card p-6">
                  <h3 className="font-bold text-gray-800 mb-4">월별 매출 (최근 6개월)</h3>
                  {revenueByMonth.some((d) => d.value > 0) ? (
                    <AmountBarChart data={revenueByMonth} />
                  ) : (
                    <p className="text-sm text-gray-500">데이터 없음</p>
                  )}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-gray-800 mb-4">서비스별 완료 건수</h3>
                {serviceCounts.length > 0 ? (
                  <BarChart data={serviceCounts} />
                ) : (
                  <p className="text-sm text-gray-500">데이터 없음</p>
                )}
              </div>
            </div>
          )}

          {tab === "groomers" && (
            <div className="space-y-8">
              <div className="p-4 bg-mimi-yellow/10 rounded-xl border border-mimi-yellow/30">
                <h2 className="text-lg font-bold text-gray-800 mb-4">디자이너관리</h2>
                <p className="text-sm text-gray-600">디자이너 인적사항, 미용 통계, 비밀번호 부여를 한 곳에서 관리합니다.</p>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-gray-800 mb-4">디자이너 통계</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-mimi-cream rounded-lg">
                    <p className="text-sm text-gray-500">디자이너 수</p>
                    <p className="text-2xl font-bold text-gray-800">{groomers.length}명</p>
                  </div>
                  <div className="p-4 bg-mimi-cream rounded-lg">
                    <p className="text-sm text-gray-500">총 미용 완료</p>
                    <p className="text-2xl font-bold text-mimi-orange">
                      {bookingsByGroomer.filter((x) => x.groomer.id !== "_none").reduce((s, x) => s + x.completed.length, 0)}건
                    </p>
                  </div>
                  <div className="p-4 bg-mimi-cream rounded-lg">
                    <p className="text-sm text-gray-500">평균 미용 (1인당)</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {groomers.length > 0
                        ? (
                            bookingsByGroomer
                              .filter((x) => x.groomer.id !== "_none")
                              .reduce((s, x) => s + x.completed.length, 0) / groomers.length
                          ).toFixed(1)
                        : 0}회
                    </p>
                  </div>
                  <div className="p-4 bg-mimi-cream rounded-lg">
                    <p className="text-sm text-gray-500">활동 / 정지</p>
                    <p className="text-lg font-bold text-gray-800">
                      {groomers.filter((g) => !g.suspended).length} / {groomers.filter((g) => g.suspended).length}
                    </p>
                  </div>
                </div>
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-2">지역별 디자이너 분포</h4>
                  {Object.keys(groomerRegionCounts).length > 0 ? (
                    <BarChart data={Object.entries(groomerRegionCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ label: k || "미입력", value: v }))} />
                  ) : (
                    <p className="text-sm text-gray-500">데이터 없음</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-4">디자이너 리스트</h4>
                  <div className="flex flex-col gap-3 mb-4">
                    <div className="flex flex-wrap gap-2 items-center">
                      <input
                        type="search"
                        value={groomerSearch}
                        onChange={(e) => setGroomerSearch(e.target.value)}
                        placeholder="이름·연락처·주소·경력 검색"
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-48"
                      />
                      <span className="text-xs text-gray-500">등록일</span>
                      <input
                        type="date"
                        value={groomerFilterDateFrom}
                        onChange={(e) => setGroomerFilterDateFrom(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                      <span className="text-gray-400">~</span>
                      <input
                        type="date"
                        value={groomerFilterDateTo}
                        onChange={(e) => setGroomerFilterDateTo(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      />
                      <select
                        value={groomerFilterRegion}
                        onChange={(e) => setGroomerFilterRegion(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      >
                        <option value="all">지역</option>
                        {Object.keys(groomerRegionCounts)
                          .sort((a, b) => groomerRegionCounts[b] - groomerRegionCounts[a])
                          .map((r) => (
                            <option key={r} value={r}>
                              {r || "미입력"} ({groomerRegionCounts[r]})
                            </option>
                          ))}
                      </select>
                      <select
                        value={groomerFilterRadius}
                        onChange={(e) => setGroomerFilterRadius(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      >
                        <option value="all">반경</option>
                        {[3, 5, 10, 15, 20, 30].map((r) => (
                          <option key={r} value={r}>{r}km</option>
                        ))}
                      </select>
                      <select
                        value={groomerFilterAccount}
                        onChange={(e) => setGroomerFilterAccount(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      >
                        <option value="all">계좌</option>
                        <option value="yes">계좌 등록됨</option>
                        <option value="no">계좌 미등록</option>
                      </select>
                      <select
                        value={groomerFilterVisits}
                        onChange={(e) => setGroomerFilterVisits(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      >
                        <option value="all">미용</option>
                        <option value="0">0회</option>
                        <option value="1">1회 이상</option>
                        <option value="5">5회 이상</option>
                        <option value="10">10회 이상</option>
                      </select>
                      <select
                        value={groomerFilterRating}
                        onChange={(e) => setGroomerFilterRating(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      >
                        <option value="all">별점</option>
                        <option value="none">미평가</option>
                        <option value="1">1점 이상</option>
                        <option value="2">2점 이상</option>
                        <option value="3">3점 이상</option>
                        <option value="4">4점 이상</option>
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        value={groomerFilterPassword}
                        onChange={(e) => setGroomerFilterPassword(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      >
                        <option value="all">비밀번호</option>
                        <option value="yes">비밀번호 부여됨</option>
                        <option value="no">비밀번호 미부여</option>
                      </select>
                      <select
                        value={groomerFilterStatus}
                        onChange={(e) => setGroomerFilterStatus(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      >
                        <option value="all">상태</option>
                        <option value="active">활동</option>
                        <option value="suspended">예약정지</option>
                      </select>
                      <select
                        value={groomerSort}
                        onChange={(e) => setGroomerSort(e.target.value as typeof groomerSort)}
                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                      >
                        <option value="visits">미용횟수순</option>
                        <option value="rating">별점순</option>
                        <option value="name">이름순</option>
                        <option value="recent">등록일순</option>
                      </select>
                    </div>
                  </div>
                  {groomerList.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-sm min-w-[900px]">
                        <thead className="bg-mimi-cream">
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">이름</th>
                            <th className="text-left py-2 px-2">등록일</th>
                            <th className="text-left py-2 px-2">전화번호</th>
                            <th className="text-left py-2 px-2">생년월일</th>
                            <th className="text-center py-2 px-2">나이</th>
                            <th className="text-center py-2 px-2">성별</th>
                            <th className="text-left py-2 px-2">지역</th>
                            <th className="text-center py-2 px-2">반경</th>
                            <th className="text-left py-2 px-2 max-w-[80px]">경력</th>
                            <th className="text-center py-2 px-2">계좌</th>
                            <th className="text-center py-2 px-2">서비스</th>
                            <th className="text-right py-2 px-2">미용</th>
                            <th className="text-center py-2 px-2">별점</th>
                            <th className="text-center py-2 px-2">비밀번호</th>
                            <th className="text-center py-2 px-2">상태</th>
                            <th className="text-center py-2 px-2">예약정지</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groomerList.map(({ g, completed, avgRating, reviews, region }) => {
                            const genderLabel = g.gender === "male" ? "남" : g.gender === "female" ? "여" : g.gender === "other" ? "기타" : "-";
                            return (
                              <tr
                                key={g.id}
                                onClick={() => setGroomerDetailModal({ g, completed: completed.length, avgRating, reviews: reviews.length })}
                                className={`border-b border-gray-100 hover:bg-mimi-cream cursor-pointer ${g.suspended ? "bg-red-50/30" : ""}`}
                              >
                                <td className="py-2 px-2 font-medium">{g.name}</td>
                                <td className="py-2 px-2 text-gray-600">{g.createdAt ? new Date(g.createdAt).toLocaleDateString("ko-KR") : "-"}</td>
                                <td className="py-2 px-2">{g.phone || "-"}</td>
                                <td className="py-2 px-2">{g.birthDate || "-"}</td>
                                <td className="py-2 px-2 text-center">{g.age ?? "-"}</td>
                                <td className="py-2 px-2 text-center">{genderLabel}</td>
                                <td className="py-2 px-2 text-gray-600 max-w-[120px] truncate" title={g.address}>{region}</td>
                                <td className="py-2 px-2 text-center">{g.radiusKm ?? 10}km</td>
                                <td className="py-2 px-2 max-w-[80px] truncate text-gray-600" title={g.career}>{g.career ?? "-"}</td>
                                <td className="py-2 px-2 text-center" title={g.bankName && g.accountNumber ? `${g.bankName} ${g.accountNumber} (${g.accountHolder || ""})` : ""}>
                                  {g.bankName && g.accountNumber ? (
                                    <span className="text-green-600 text-xs">✓</span>
                                  ) : (
                                    <span className="text-amber-600 text-xs">미등록</span>
                                  )}
                                </td>
                                <td className="py-2 px-2 text-center">{g.services?.length ?? 0}개</td>
                                <td className="py-2 px-2 text-right font-medium">{completed.length}회</td>
                                <td className="py-2 px-2 text-center">{avgRating ? `⭐ ${avgRating} (${reviews.length})` : "-"}</td>
                                <td className="py-2 px-2 max-w-[100px]">
                                  <span className="text-gray-700 font-mono text-xs mr-1" title={g.passwordPlain || undefined}>{g.passwordPlain || "-"}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setGroomerPwModal({ id: g.id, name: g.name });
                                      setGroomerPwInput("");
                                      setGroomerPwError("");
                                    }}
                                    className="px-2 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700"
                                  >
                                    {g.passwordHash ? "변경" : "부여"}
                                  </button>
                                </td>
                                <td className="py-2 px-2 text-center">
                                  {g.suspended ? (
                                    <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs">정지</span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">활동</span>
                                  )}
                                </td>
                                <td className="py-2 px-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateGroomer(g.id, { suspended: !g.suspended }).then(() => {
                                        getBookings().then(setBookings);
                                        setGroomersRefresh((r) => r + 1);
                                      });
                                    }}
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      g.suspended ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-red-700"
                                    }`}
                                  >
                                    {g.suspended ? "재개" : "정지"}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-4">조건에 맞는 디자이너가 없습니다.</p>
                  )}
                  {groomerList.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">총 {groomerList.length}명</p>
                  )}
                </div>
              </div>
              {groomerDetailModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setGroomerDetailModal(null); setGroomerSmsBody(""); }}>
                  <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="font-bold text-xl text-gray-800">{groomerDetailModal.g.name} 디자이너 상세</h3>
                      <button onClick={() => { setGroomerDetailModal(null); setGroomerSmsBody(""); }} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-4">
                      <div><span className="text-gray-500">등록일</span><p className="font-medium">{groomerDetailModal.g.createdAt ? new Date(groomerDetailModal.g.createdAt).toLocaleDateString("ko-KR") : "-"}</p></div>
                      <div><span className="text-gray-500">전화번호</span><p className="font-medium">{groomerDetailModal.g.phone || "-"}</p></div>
                      <div><span className="text-gray-500">이메일</span><p className="font-medium truncate" title={groomerDetailModal.g.email}>{groomerDetailModal.g.email || "-"}</p></div>
                      <div><span className="text-gray-500">생년월일</span><p className="font-medium">{groomerDetailModal.g.birthDate || "-"}</p></div>
                      <div><span className="text-gray-500">나이</span><p className="font-medium">{groomerDetailModal.g.age ?? "-"}세</p></div>
                      <div><span className="text-gray-500">성별</span><p className="font-medium">{groomerDetailModal.g.gender === "male" ? "남성" : groomerDetailModal.g.gender === "female" ? "여성" : "-"}</p></div>
                      <div><span className="text-gray-500">방문반경</span><p className="font-medium">{groomerDetailModal.g.radiusKm ?? 10}km</p></div>
                      <div className="col-span-2"><span className="text-gray-500">주소</span><p className="font-medium">{groomerDetailModal.g.address || "-"}</p></div>
                      <div className="col-span-2"><span className="text-gray-500">소개글</span><p className="text-gray-700 whitespace-pre-wrap">{groomerDetailModal.g.intro || "-"}</p></div>
                      <div className="col-span-2"><span className="text-gray-500">경력</span><p className="text-gray-700 whitespace-pre-wrap">{groomerDetailModal.g.career || "-"}</p></div>
                      <div className="col-span-2"><span className="text-gray-500">정산 계좌</span><p className="font-medium">{groomerDetailModal.g.bankName && groomerDetailModal.g.accountNumber ? `${groomerDetailModal.g.bankName} ${groomerDetailModal.g.accountNumber} (${groomerDetailModal.g.accountHolder || ""})` : "미등록"}</p></div>
                      <div><span className="text-gray-500">미용 완료</span><p className="font-medium">{groomerDetailModal.completed}회</p></div>
                      <div><span className="text-gray-500">별점</span><p className="font-medium">{groomerDetailModal.avgRating ? `⭐ ${groomerDetailModal.avgRating} (${groomerDetailModal.reviews}건)` : "-"}</p></div>
                      <div><span className="text-gray-500">비밀번호</span><p className="font-medium font-mono">{groomerDetailModal.g.passwordPlain || "-"}</p></div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        onClick={() => {
                          setGroomerPwModal({ id: groomerDetailModal.g.id, name: groomerDetailModal.g.name });
                          setGroomerPwInput("");
                          setGroomerPwError("");
                          setGroomerDetailModal(null);
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {groomerDetailModal.g.passwordHash ? "비밀번호 변경" : "비밀번호 부여"}
                      </button>
                      {groomerDetailModal.g.phone && (
                        <>
                          <a href={`tel:${groomerDetailModal.g.phone!.replace(/\D/g, "")}`} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-600 text-white hover:bg-gray-700">
                            전화 걸기
                          </a>
                          <a href={`sms:${groomerDetailModal.g.phone!.replace(/\D/g, "")}`} className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700">
                            문자앱 열기
                          </a>
                        </>
                      )}
                    </div>
                    {groomerDetailModal.g.phone && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-800 mb-2">문자 전송 (발송 기록 저장)</h4>
                        <textarea
                          value={groomerSmsBody}
                          onChange={(e) => setGroomerSmsBody(e.target.value)}
                          placeholder="문자 내용 입력"
                          rows={3}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm mb-2"
                        />
                        <button
                          onClick={() => {
                            if (!groomerSmsBody.trim()) return;
                            handleSendSms(groomerDetailModal.g.phone!, groomerSmsBody);
                            setSmsLog(getSmsLog());
                            setGroomerSmsBody("");
                            alert("문자가 발송되었습니다.");
                          }}
                          disabled={!groomerSmsBody.trim()}
                          className="px-4 py-2 bg-mimi-orange text-white rounded-lg text-sm font-medium hover:bg-mimi-orange/90 disabled:opacity-50"
                        >
                          문자 발송
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {groomerPwModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setGroomerPwModal(null)}>
                  <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <h3 className="font-bold text-gray-800 mb-2">디자이너 비밀번호 {groomers.find((x) => x.id === groomerPwModal.id)?.passwordHash ? "변경" : "부여"}</h3>
                    <p className="text-sm text-gray-600 mb-4">{groomerPwModal.name}님의 대시보드 로그인 비밀번호를 설정합니다.</p>
                    <input
                      type="password"
                      value={groomerPwInput}
                      onChange={(e) => { setGroomerPwInput(e.target.value); setGroomerPwError(""); }}
                      placeholder="6자 이상"
                      className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-mimi-orange outline-none mb-2"
                    />
                    {groomerPwError && <p className="text-sm text-red-600 mb-2">{groomerPwError}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => setGroomerPwModal(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700">취소</button>
                      <button
                        onClick={async () => {
                          if (groomerPwInput.length < 6) {
                            setGroomerPwError("비밀번호는 6자 이상이어야 합니다.");
                            return;
                          }
                          const h = await hashPassword(groomerPwInput);
                          await updateGroomer(groomerPwModal.id, { passwordHash: h, passwordPlain: groomerPwInput });
                          setGroomerPwModal(null);
                          setGroomerPwInput("");
                          setGroomersRefresh((k) => k + 1);
                          alert("비밀번호가 설정되었습니다.");
                        }}
                        className="flex-1 py-2 bg-mimi-orange text-white rounded-lg font-medium"
                      >
                        설정
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "customers" && (
            <div className="space-y-8">
              <div className="p-4 bg-mimi-yellow/10 rounded-xl border border-mimi-yellow/30">
                <h2 className="text-lg font-bold text-gray-800 mb-4">고객관리</h2>
                <p className="text-sm text-gray-600">고객 통계와 문자 알림을 한 곳에서 관리합니다.</p>
              </div>

              <div className="card p-6">
                <h3 className="font-bold text-gray-800 mb-4">고객 통계</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-mimi-cream rounded-lg">
                    <p className="text-sm text-gray-500">고객 수</p>
                    <p className="text-2xl font-bold text-gray-800">{uniqueCustomers}명</p>
                  </div>
                  <div className="p-4 bg-mimi-cream rounded-lg">
                    <p className="text-sm text-gray-500">총 예약 (취소 제외)</p>
                    <p className="text-2xl font-bold text-mimi-orange">{bookings.filter((b) => b.status !== "cancelled").length}건</p>
                  </div>
                  <div className="p-4 bg-mimi-cream rounded-lg">
                    <p className="text-sm text-gray-500">평균 이용 횟수</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {uniqueCustomers > 0
                        ? (Object.values(customerCounts).reduce((s, v) => s + v.count, 0) / uniqueCustomers).toFixed(1)
                        : 0}회
                    </p>
                  </div>
                  <div className="p-4 bg-mimi-cream rounded-lg">
                    <p className="text-sm text-gray-500">신규 / 재방문</p>
                    <p className="text-lg font-bold text-gray-800">
                      {Object.values(customerCounts).filter((v) => v.count === 1).length} / {Object.values(customerCounts).filter((v) => v.count > 1).length}
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">지역별 고객 분포</h4>
                    {Object.keys(regionCounts).length > 0 ? (
                      <BarChart data={Object.entries(regionCounts).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({ label: k || "미입력", value: v }))} />
                    ) : (
                      <p className="text-sm text-gray-500">데이터 없음</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">이용 횟수별 분포</h4>
                    {Object.keys(visitDistribution).length > 0 ? (
                      <BarChart data={["1회", "2~3회", "4~5회", "6회+"].filter((k) => visitDistribution[k]).map((k) => ({ label: k, value: visitDistribution[k] ?? 0 }))} />
                    ) : (
                      <p className="text-sm text-gray-500">데이터 없음</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-4">고객 리스트</h4>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <input
                      type="search"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="이름·연락처·주소 검색"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-48"
                    />
                    <select
                      value={customerFilterRegion}
                      onChange={(e) => setCustomerFilterRegion(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="all">전체 지역</option>
                      {Object.keys(regionCounts)
                        .sort((a, b) => regionCounts[b] - regionCounts[a])
                        .map((r) => (
                          <option key={r} value={r}>
                            {r || "미입력"} ({regionCounts[r]})
                          </option>
                        ))}
                    </select>
                    <select
                      value={customerFilterVisit}
                      onChange={(e) => setCustomerFilterVisit(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="all">전체 이용횟수</option>
                      <option value="1">1회 (신규)</option>
                      <option value="2-3">2~3회</option>
                      <option value="4-5">4~5회</option>
                      <option value="6+">6회+ (VIP)</option>
                    </select>
                    <select
                      value={customerSort}
                      onChange={(e) => setCustomerSort(e.target.value as typeof customerSort)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="visits">이용횟수순</option>
                      <option value="recent">최근방문순</option>
                      <option value="amount">총이용금액순</option>
                      <option value="name">이름순</option>
                    </select>
                  </div>
                  {customerList.length > 0 ? (
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-sm min-w-[800px]">
                        <thead className="bg-mimi-cream">
                          <tr className="border-b">
                            <th className="text-center py-2 px-2 w-12">
                              {(() => {
                                const eligible = customerList.filter((c) => (c.phone || c.key) && /^[\d-]+$/.test(c.phone || c.key));
                                const allSelected = eligible.length > 0 && selectedCustomerKeys.size >= eligible.length;
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (allSelected) {
                                        setSelectedCustomerKeys(new Set());
                                      } else {
                                        setSelectedCustomerKeys(new Set(eligible.map((c) => c.key)));
                                      }
                                    }}
                                    className="text-xs text-mimi-orange hover:underline"
                                  >
                                    {allSelected ? "해제" : "전체"}
                                  </button>
                                );
                              })()}
                            </th>
                            <th className="text-left py-2 px-2">구분</th>
                            <th className="text-left py-2 px-2">이름</th>
                            <th className="text-left py-2 px-2">연락처</th>
                            <th className="text-left py-2 px-2">지역</th>
                            <th className="text-right py-2 px-2">이용</th>
                            <th className="text-right py-2 px-2">총금액</th>
                            <th className="text-left py-2 px-2">첫방문</th>
                            <th className="text-left py-2 px-2">최근방문</th>
                            <th className="text-left py-2 px-2">반려동물</th>
                            <th className="text-left py-2 px-2">서비스</th>
                            <th className="text-right py-2 px-2">포인트</th>
                            <th className="text-center py-2 px-2 w-16">문자</th>
                          </tr>
                        </thead>
                        <tbody>
                          {customerList.map((c) => (
                            <tr key={c.key} className="border-b border-gray-100 hover:bg-mimi-cream">
                              <td className="py-2 px-2 text-center">
                                {(c.phone || (c.key && /^[\d-]+$/.test(c.key))) ? (
                                  <input
                                    type="checkbox"
                                    checked={selectedCustomerKeys.has(c.key)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedCustomerKeys((prev) => new Set(Array.from(prev).concat(c.key)));
                                      } else {
                                        setSelectedCustomerKeys((prev) => {
                                          const next = new Set(prev);
                                          next.delete(c.key);
                                          return next;
                                        });
                                      }
                                    }}
                                    className="w-4 h-4 rounded border-gray-300 text-mimi-orange"
                                  />
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                    c.type === "VIP" ? "bg-amber-100 text-amber-800" : c.type === "재방문" ? "bg-blue-50 text-blue-800" : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {c.type}
                                </span>
                              </td>
                              <td className="py-2 px-2 font-medium">{c.name || "-"}</td>
                              <td className="py-2 px-2">{c.phone || c.email || c.key || "-"}</td>
                              <td className="py-2 px-2 text-gray-600">{c.region}</td>
                              <td className="py-2 px-2 text-right font-medium">{c.visitCount}회</td>
                              <td className="py-2 px-2 text-right">{c.totalAmount.toLocaleString()}원</td>
                              <td className="py-2 px-2 text-gray-600">{c.firstDate || "-"}</td>
                              <td className="py-2 px-2 text-gray-600">{c.lastDate || "-"}</td>
                              <td className="py-2 px-2 text-gray-600 max-w-[120px] truncate" title={c.pets.join(", ")}>
                                {c.pets.length > 0 ? c.pets.join(", ") : "-"}
                              </td>
                              <td className="py-2 px-2 text-gray-600 max-w-[100px] truncate" title={c.services.join(", ")}>
                                {c.services.length > 0 ? c.services.join(", ") : "-"}
                              </td>
                              <td className="py-2 px-2 text-right font-medium text-amber-700">
                                {getCustomerPoints(c.phone || c.key, c.email)}P
                              </td>
                              <td className="py-2 px-2 text-center">
                                {(c.phone || (c.key && /^[\d-]+$/.test(c.key))) ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSmsSendTo(c.phone || c.key);
                                      const el = document.querySelector('[data-sms-section]');
                                      el?.scrollIntoView({ behavior: "smooth" });
                                    }}
                                    className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 hover:bg-green-200"
                                  >
                                    발송
                                  </button>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-4">조건에 맞는 고객이 없습니다.</p>
                  )}
                  {customerList.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">총 {customerList.length}명</p>
                  )}
                </div>
              </div>

              <div className="card p-6" data-sms-section>
                <h3 className="font-bold text-gray-800 mb-4">문자 알림</h3>
                <p className="text-sm text-gray-600 mb-4">변수: {"{customerName}"}, {"{date}"}, {"{time}"}, {"{groomerName}"}, {"{serviceName}"}</p>
                <div className="space-y-4 mb-6">
                  {smsTemplates.map((t) => (
                    <div key={t.id} className="p-4 bg-mimi-cream rounded-lg">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-800">{t.name}</p>
                        <button
                          onClick={() => setEditingTemplate(editingTemplate?.id === t.id ? null : t)}
                          className="text-sm text-mimi-orange hover:underline"
                        >
                          {editingTemplate?.id === t.id ? "취소" : "수정"}
                        </button>
                      </div>
                      {editingTemplate?.id === t.id ? (
                        <div className="mt-2">
                          <textarea
                            value={editingTemplate.body}
                            onChange={(e) => setEditingTemplate((prev) => prev ? { ...prev, body: e.target.value } : null)}
                            rows={4}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                          />
                          <button
                            onClick={() => {
                              const updated = smsTemplates.map((x) => (x.id === t.id ? editingTemplate! : x));
                              saveSmsTemplates(updated);
                              setSmsTemplates(updated);
                              setEditingTemplate(null);
                            }}
                            className="mt-2 px-4 py-2 bg-mimi-orange text-white rounded-lg text-sm font-medium"
                          >
                            저장
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{t.body}</p>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-blue-50 rounded-lg mb-6 border border-blue-200">
                  <h4 className="font-medium text-gray-800 mb-3">고객 선택 발송 / 전체 발송</h4>
                  <p className="text-sm text-gray-600 mb-3">고객 리스트에서 체크한 고객에게만 발송(선택 발송)하거나, 현재 필터된 전체 고객에게 발송(전체 발송)합니다.</p>
                  <div className="flex flex-wrap gap-3 items-center">
                    <select
                      value={smsBulkTemplateId}
                      onChange={(e) => setSmsBulkTemplateId(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    >
                      <option value="">직접 입력 메시지 사용</option>
                      {smsTemplates.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSendSmsBulk(
                        customerList.filter((c) => selectedCustomerKeys.has(c.key)).map((c) => ({
                          key: c.key,
                          phone: c.phone || c.key,
                          name: c.name,
                        })),
                        !!smsBulkTemplateId
                      )}
                      disabled={selectedCustomerKeys.size === 0 || (!smsBulkTemplateId && !smsSendBody.trim())}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    >
                      선택 발송 ({selectedCustomerKeys.size}명)
                    </button>
                    <button
                      onClick={() => handleSendSmsBulk(
                        customerList.filter((c) => c.phone && /^[\d-]+$/.test(c.phone)).map((c) => ({
                          key: c.key,
                          phone: c.phone || c.key,
                          name: c.name,
                        })),
                        !!smsBulkTemplateId
                      )}
                      disabled={customerList.filter((c) => c.phone && /^[\d-]+$/.test(c.phone)).length === 0 || (!smsBulkTemplateId && !smsSendBody.trim())}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      전체 발송 ({customerList.filter((c) => c.phone && /^[\d-]+$/.test(c.phone)).length}명)
                    </button>
                  </div>
                  {!smsBulkTemplateId && (
                    <p className="text-xs text-amber-700 mt-2">* 템플릿 미선택 시 아래 &quot;직접 입력&quot; 메시지가 사용됩니다.</p>
                  )}
                </div>
                <div className="p-4 bg-mimi-cream rounded-lg mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">직접 입력 발송 (1건)</h4>
                  <p className="text-sm text-gray-600 mb-3">수신번호와 메시지를 직접 입력하여 1건 발송합니다. 고객 리스트의 &quot;발송&quot; 버튼으로도 수신번호를 채울 수 있습니다.</p>
                  <div className="flex flex-wrap gap-4">
                    <input
                      type="tel"
                      value={smsSendTo}
                      onChange={(e) => setSmsSendTo(e.target.value)}
                      placeholder="수신번호 010-1234-5678"
                      className="px-4 py-2 rounded-lg border border-gray-200 w-40"
                    />
                    <input
                      type="text"
                      value={smsSendBody}
                      onChange={(e) => setSmsSendBody(e.target.value)}
                      placeholder="메시지 내용 (선택/전체 발송 시 템플릿 미선택하면 사용)"
                      className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => smsSendTo && smsSendBody && handleSendSms(smsSendTo, smsSendBody)}
                      disabled={!smsSendTo.trim() || !smsSendBody.trim()}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      발송
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">발송 로그</h4>
                  {smsLog.length === 0 ? (
                    <p className="text-gray-500 text-sm">발송 내역이 없습니다</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {smsLog.map((l) => (
                        <div key={l.id} className="flex justify-between items-start p-3 bg-mimi-cream rounded-lg text-sm">
                          <div>
                            <span className="font-medium">{l.to}</span>
                            <p className="text-gray-600 mt-1 line-clamp-2">{l.body}</p>
                          </div>
                          <span className={`shrink-0 px-2 py-0.5 rounded text-xs ${l.status === "sent" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {l.status === "sent" ? "발송완료" : l.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "time" && (
            <div className="space-y-8">
              <div className="card p-6">
                <h3 className="font-bold text-gray-800 mb-4">시간대별 예약 분포</h3>
                {timeSlotCounts.some((d) => d.value > 0) ? (
                  <BarChart data={timeSlotCounts} />
                ) : (
                  <p className="text-sm text-gray-500">데이터 없음</p>
                )}
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-gray-800 mb-4">요일별 예약 분포</h3>
                {dayOfWeekCounts.some((d) => d.value > 0) ? (
                  <BarChart data={dayOfWeekCounts} />
                ) : (
                  <p className="text-sm text-gray-500">데이터 없음</p>
                )}
              </div>
              {hourlyCounts.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-bold text-gray-800 mb-4">시간대 상세 (예약 있는 시간)</h3>
                  <BarChart data={hourlyCounts} />
                </div>
              )}
            </div>
          )}

          {tab === "bookings" && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-mimi-cream rounded-xl">
                  <h4 className="font-medium text-gray-800 mb-2">상태별</h4>
                  <div className="flex flex-wrap gap-2">
                    {["paid", "confirmed", "completed", "cancelled"].map((s) => (
                      <span key={s} className="px-3 py-1 bg-white rounded-full text-sm border">
                        {getStatusLabel(s)} {bookings.filter((b) => b.status === s).length}건
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-mimi-cream rounded-xl">
                  <h4 className="font-medium text-gray-800 mb-2">서비스별 (완료)</h4>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_DEFS.slice(0, 4).map((s) => (
                      <span key={s.id} className="px-3 py-1 bg-white rounded-full text-sm border">
                        {s.name} {completedBookings.filter((b) => b.serviceId === s.id || b.serviceName === s.name).length}건
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-gray-800 mb-4">디자이너별 예약 요약</h3>
                {groomers.length === 0 ? (
                  <p className="text-gray-500">등록된 디자이너가 없습니다</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">디자이너</th>
                          <th className="text-right py-2">총 예약</th>
                          <th className="text-right py-2">결제완료</th>
                          <th className="text-right py-2">예약확정</th>
                          <th className="text-right py-2">서비스완료</th>
                          <th className="text-right py-2">취소</th>
                          <th className="text-right py-2">매출</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookingsByGroomer.filter((x) => x.groomer.id !== "_none").map(({ groomer, bookings: gb, completed, revenue }) => (
                          <tr key={groomer.id} className="border-b border-gray-100 hover:bg-mimi-cream">
                            <td className="py-2 font-medium">{groomer.name}</td>
                            <td className="text-right py-2">{gb.length}건</td>
                            <td className="text-right py-2">{gb.filter((b) => b.status === "paid").length}</td>
                            <td className="text-right py-2">{gb.filter((b) => b.status === "confirmed").length}</td>
                            <td className="text-right py-2">{completed.length}</td>
                            <td className="text-right py-2">{gb.filter((b) => b.status === "cancelled").length}</td>
                            <td className="text-right py-2 font-medium text-mimi-orange">{revenue.toLocaleString()}원</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-gray-800 mb-4">예약 목록</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  <select
                    value={bookingsFilterGroomer}
                    onChange={(e) => setBookingsFilterGroomer(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    <option value="all">전체 디자이너</option>
                    {groomers.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                    {noGroomerBookings.length > 0 && <option value="_none">(미지정)</option>}
                  </select>
                  <select
                    value={bookingsFilterStatus}
                    onChange={(e) => setBookingsFilterStatus(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                  >
                    <option value="all">전체 상태</option>
                    <option value="paid">결제완료</option>
                    <option value="confirmed">예약확정</option>
                    <option value="completed">서비스완료</option>
                    <option value="cancelled">취소</option>
                  </select>
                  <input
                    type="date"
                    value={bookingsFilterDateFrom}
                    onChange={(e) => setBookingsFilterDateFrom(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    placeholder="시작일"
                  />
                  <span className="self-center text-gray-500">~</span>
                  <input
                    type="date"
                    value={bookingsFilterDateTo}
                    onChange={(e) => setBookingsFilterDateTo(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    placeholder="종료일"
                  />
                </div>
                {filteredBookings.length === 0 ? (
                  <div className="text-center py-12 bg-mimi-cream rounded-xl">
                    <p className="text-gray-600">조건에 맞는 예약이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBookings.map((b) => {
                    const phone = b.phone ?? b.customerPhone ?? "";
                    const templateBody = getSmsTemplates()[0]?.body ?? "[미미살롱펫] {customerName}님 예약 안내: {date} {time}";
                    const filled = fillTemplate(templateBody, {
                      customerName: b.customerName ?? "고객",
                      date: b.date ?? "",
                      time: b.time ?? "",
                      groomerName: b.groomerName ?? "",
                      serviceName: b.serviceName ?? "",
                    });
                    return (
                      <div key={b.id} className="card p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-800">{b.serviceName}</p>
                            <p className="text-sm text-gray-600">{b.date} {b.time}</p>
                            <p className="text-sm text-gray-600">{formatPets(b)}</p>
                            {b.additionalFees && b.additionalFees.length > 0 && (
                              <p className="text-xs text-amber-700">추가: {b.additionalFees.map((f) => `${f.name} ${f.price.toLocaleString()}원`).join(", ")}</p>
                            )}
                            <p className="text-sm text-gray-600">{b.address}</p>
                            <p className="text-sm text-gray-600">{b.customerName && `${b.customerName} · `}{b.groomerName && `디자이너: ${b.groomerName} · `}{phone}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-mimi-orange">{b.price?.toLocaleString()}원</p>
                            <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {getStatusLabel(b.status)}
                            </span>
                            {b.customerNotifiedAt && <p className="text-xs text-green-600 mt-1">✓ 고객 통보</p>}
                            {b.settlementStatus === "settled" && <p className="text-xs text-blue-600">정산완료</p>}
                            {phone && (
                              <button
                                onClick={() => handleSendSms(phone, filled, b.id)}
                                className="mt-2 block w-full px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                              >
                                문자 발송
                              </button>
                            )}
                          </div>
                        </div>
                        {b.status === "completed" && ((b.beforePhotos?.length ?? 0) > 0 || (b.afterPhotos?.length ?? 0) > 0 || b.reviewRating != null) && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="font-medium text-gray-700 mb-2 text-sm">📷 사진 · 이용후기</h4>
                            {((b.beforePhotos?.length ?? 0) > 0 || (b.afterPhotos?.length ?? 0) > 0) && (
                              <div className="flex gap-3 overflow-x-auto pb-2 mb-2">
                                {(b.beforePhotos ?? []).map((url, i) => (
                                  <div key={`b-${i}`} className="shrink-0">
                                    <p className="text-xs text-gray-500 mb-0.5">미용 전</p>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt={`미용 전 ${i + 1}`} className="w-14 h-14 object-cover rounded border" />
                                  </div>
                                ))}
                                {(b.afterPhotos ?? []).map((url, i) => (
                                  <div key={`a-${i}`} className="shrink-0">
                                    <p className="text-xs text-gray-500 mb-0.5">미용 후</p>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={url} alt={`미용 후 ${i + 1}`} className="w-14 h-14 object-cover rounded border" />
                                  </div>
                                ))}
                              </div>
                            )}
                            {b.reviewRating != null && (
                              <div>
                                <StarRating value={b.reviewRating} readonly size="sm" />
                                {b.reviewText && <p className="text-xs text-gray-600 mt-1">{b.reviewText}</p>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "settlement" && (
            <div className="space-y-6">
              <div className="card p-6 bg-blue-50/50 border-2 border-blue-100">
                <h3 className="font-bold text-gray-800 mb-3">📋 정산 흐름</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li><strong>디자이너 선택</strong> – 정산할 디자이너를 선택합니다.</li>
                  <li><strong>미정산 내역 확인</strong> – 서비스 완료 후 정산요청된 건을 확인합니다.</li>
                  <li><strong>입금</strong> – 디자이너 계좌로 정산금액을 입금합니다.</li>
                  <li><strong>정산완료 처리</strong> – 입금 완료 후 &quot;정산완료&quot; 버튼을 클릭합니다.</li>
                </ol>
              </div>
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <select
                  value={settlementFilterGroomer}
                  onChange={(e) => setSettlementFilterGroomer(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                >
                  <option value="all">전체 디자이너</option>
                  {groomers.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => downloadSettlementExcel(completedBookings, unsettled, settled, groomers, bookingsByGroomer, commissionRate, pointValueWon)}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  📥 엑셀 다운로드
                </button>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-6 bg-amber-50 rounded-xl border border-amber-200">
                  <p className="text-sm text-amber-800">미정산</p>
                  <p className="text-2xl font-bold text-amber-700">{unsettled.length}건</p>
                  <p className="text-lg font-medium text-amber-800">{unsettledAmount.toLocaleString()}원 (디자이너 정산액)</p>
                </div>
                <div className="p-6 bg-green-50 rounded-xl border border-green-200">
                  <p className="text-sm text-green-800">정산완료</p>
                  <p className="text-2xl font-bold text-green-700">{settled.length}건</p>
                  <p className="text-lg font-medium text-green-800">{settledAmount.toLocaleString()}원</p>
                </div>
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-800">플랫폼 수수료 (총)</p>
                  <p className="text-2xl font-bold text-blue-700">{totalCommission.toLocaleString()}원</p>
                  <p className="text-sm text-blue-600">수수료율 {commissionRate}%</p>
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-gray-800 mb-4">디자이너별 정산 요약</h3>
                {groomers.length === 0 ? (
                  <p className="text-gray-500">등록된 디자이너가 없습니다</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">디자이너</th>
                          <th className="text-right py-2">완료건수</th>
                          <th className="text-right py-2">매출</th>
                          <th className="text-right py-2">수수료</th>
                          <th className="text-right py-2">미정산</th>
                          <th className="text-right py-2">정산완료</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookingsByGroomer.filter((x) => x.groomer.id !== "_none").map(({ groomer, completed, revenue, commission, unsettled: gu, settled: gs, unsettledAmount, settledAmount }) => (
                          <tr key={groomer.id} className="border-b border-gray-100 hover:bg-mimi-cream">
                            <td className="py-2 font-medium">{groomer.name}</td>
                            <td className="text-right py-2">{completed.length}건</td>
                            <td className="text-right py-2">{revenue.toLocaleString()}원</td>
                            <td className="text-right py-2 text-blue-600">{commission.toLocaleString()}원</td>
                            <td className="text-right py-2 text-amber-700">{gu.length}건 · {unsettledAmount.toLocaleString()}원</td>
                            <td className="text-right py-2 text-green-700">{gs.length}건 · {settledAmount.toLocaleString()}원</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-gray-800 mb-4">
                  {settlementFilterGroomer === "all" ? "전체" : groomers.find((g) => g.id === settlementFilterGroomer)?.name ?? ""} 미정산 내역
                </h3>
                {(() => {
                  const targetUnsettled = settlementFilterGroomer === "all"
                    ? unsettled
                    : unsettled.filter((b) => b.groomerId === settlementFilterGroomer);
                  if (targetUnsettled.length === 0) {
                    return <p className="text-gray-500">미정산 건이 없습니다</p>;
                  }
                  return (
                    <div className="space-y-3">
                      {targetUnsettled.map((b) => {
                        const st = svcTotal(b);
                        const fee = calcCommission(st, commissionRate);
                        const toGroomer = calcSettlementAmount(st, commissionRate);
                        const handleSettleOne = async () => {
                          if (!confirm(`정산금액 ${toGroomer.toLocaleString()}원 입금 완료 후 정산완료 처리합니다.`)) return;
                          await updateBooking(b.id, { settlementStatus: "settled" });
                          getBookings().then(setBookings);
                          alert("정산완료 처리되었습니다.");
                        };
                        return (
                          <div key={b.id} className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 p-3 bg-mimi-cream rounded-lg">
                            <div>
                              <span className="font-medium">{b.serviceName}</span>
                              {b.settlementRequestedAt && (
                                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 rounded">정산요청됨</span>
                              )}
                              <span className="text-sm text-gray-600 ml-2">{b.date} {b.time} · {b.groomerName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right text-sm">
                                <span className="text-gray-600">매출 {svcTotal(b).toLocaleString()}원</span>
                                <span className="mx-2">→</span>
                                <span className="text-blue-600">수수료 {fee.toLocaleString()}원</span>
                                <span className="mx-2">→</span>
                                <span className="font-medium text-green-700">디자이너 {toGroomer.toLocaleString()}원</span>
                              </div>
                              <button
                                onClick={handleSettleOne}
                                className="shrink-0 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                              >
                                정산완료
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
              {settlementFilterGroomer === "all" && unsettled.length > 0 && (
                <div className="card p-6 border-2 border-amber-200 bg-amber-50/30">
                  <h3 className="font-bold text-gray-800 mb-3">⚡ 정산하기</h3>
                  <p className="text-sm text-gray-600 mb-4">디자이너를 선택하여 정산을 진행하세요.</p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Set(unsettled.map((b) => b.groomerId))).filter(Boolean).map((gid) => {
                      const g = groomers.find((x) => x.id === gid);
                      const count = unsettled.filter((b) => b.groomerId === gid).length;
                      const amount = unsettled.filter((b) => b.groomerId === gid).reduce((s, b) => s + calcSettlementAmount(svcTotal(b), commissionRate), 0);
                      return (
                        <button
                          key={gid}
                          onClick={() => setSettlementFilterGroomer(gid!)}
                          className="px-4 py-2 bg-mimi-orange text-white rounded-lg font-medium hover:bg-mimi-orange/90"
                        >
                          {g?.name ?? "알 수 없음"} ({count}건 · {amount.toLocaleString()}원)
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {settlementFilterGroomer !== "all" && (() => {
                const targetGroomer = groomers.find((g) => g.id === settlementFilterGroomer) as GroomerProfile | undefined;
                const targetUnsettled = unsettled.filter((b) => b.groomerId === settlementFilterGroomer);
                const totalToTransfer = targetUnsettled.reduce((s, b) => s + calcSettlementAmount(svcTotal(b), commissionRate), 0);
                const hasBankInfo = targetGroomer?.bankName && targetGroomer?.accountNumber && targetGroomer?.accountHolder;
                const handleSettleAll = async () => {
                  if (!confirm(`총 ${totalToTransfer.toLocaleString()}원을 입금하셨나요?\n\n입금 완료 후 정산완료 처리됩니다.`)) return;
                  await Promise.all(targetUnsettled.map((b) => updateBooking(b.id, { settlementStatus: "settled" })));
                  getBookings().then(setBookings);
                  alert("정산완료 처리되었습니다.");
                };
                return (
                  <div className="card p-6 border-2 border-mimi-orange/30">
                    <h3 className="font-bold text-gray-800 mb-4">💰 정산 진행</h3>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-4">
                      <li>아래 입금 정보로 디자이너 계좌에 <strong className="text-mimi-orange">{totalToTransfer.toLocaleString()}원</strong> 입금</li>
                      <li>입금 완료 후 &quot;입금 완료 · 정산완료 처리&quot; 버튼 클릭</li>
                    </ol>
                    {(settings.settlementBankName || settings.settlementAccountNumber) && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-3">
                        <p className="text-xs text-gray-500 mb-2">보낼 계좌 (송금 출금)</p>
                        <p className="font-medium">{settings.settlementBankName ?? ""}</p>
                        <p className="text-gray-800">{settings.settlementAccountNumber ?? ""}</p>
                        <p className="text-sm text-gray-600">예금주: {settings.settlementAccountHolder ?? ""}</p>
                      </div>
                    )}
                    {hasBankInfo ? (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
                        <p className="text-xs text-gray-500 mb-2">입금 정보 ({targetGroomer?.name})</p>
                        <p className="font-medium">{targetGroomer?.bankName}</p>
                        <p className="text-lg font-bold text-gray-800">{targetGroomer?.accountNumber}</p>
                        <p className="text-sm text-gray-600">예금주: {targetGroomer?.accountHolder}</p>
                        <p className="text-sm font-medium text-mimi-orange mt-2">입금액: {totalToTransfer.toLocaleString()}원</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                        <p className="text-amber-800 text-sm">⚠️ 디자이너가 계좌 정보를 등록하지 않았습니다.</p>
                        <p className="text-xs text-amber-700 mt-1">디자이너 프로필 → 기본정보 → 정산용 계좌 정보를 입력해 주세요.</p>
                      </div>
                    )}
                    <button
                      onClick={handleSettleAll}
                      disabled={targetUnsettled.length === 0 || !hasBankInfo}
                      className="w-full py-3 bg-mimi-orange text-white rounded-xl font-bold hover:bg-mimi-orange/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      입금 완료 · 정산완료 처리 ({targetUnsettled.length}건)
                    </button>
                  </div>
                );
              })()}
              <div className="card p-6">
                <h3 className="font-bold text-gray-800 mb-4">
                  {settlementFilterGroomer === "all" ? "전체" : groomers.find((g) => g.id === settlementFilterGroomer)?.name ?? ""} 정산완료 내역
                </h3>
                {(() => {
                  const targetSettled = settlementFilterGroomer === "all"
                    ? settled
                    : settled.filter((b) => b.groomerId === settlementFilterGroomer);
                  if (targetSettled.length === 0) {
                    return <p className="text-gray-500">정산완료 건이 없습니다</p>;
                  }
                  return (
                    <div className="space-y-3">
                      {targetSettled.map((b) => {
                        const st = svcTotal(b);
                        const fee = calcCommission(st, commissionRate);
                        const toGroomer = calcSettlementAmount(st, commissionRate);
                        return (
                          <div key={b.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                            <div>
                              <span className="font-medium">{b.serviceName}</span>
                              <span className="text-sm text-gray-600 ml-2">{b.date} {b.time} · {b.groomerName}</span>
                            </div>
                            <div className="text-right text-sm">
                              <span className="text-gray-600">매출 {svcTotal(b).toLocaleString()}원</span>
                              <span className="mx-2">→</span>
                              <span className="text-blue-600">수수료 {fee.toLocaleString()}원</span>
                              <span className="mx-2">→</span>
                              <span className="font-medium text-green-700">디자이너 {toGroomer.toLocaleString()}원</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {tab === "prices" && (
            <div className="space-y-8">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">추가사항 (추가요금) 설정</h2>
              <p className="text-sm text-gray-600 mb-6">스타일 얼굴컷, 엉킴, 지병, 사나움 등 추가요금 항목을 요금표 형식으로 설정합니다.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-stone-50">
                      <th className="border border-stone-200 px-3 py-2 text-left font-medium text-gray-700">항목명</th>
                      <th className="border border-stone-200 px-3 py-2 text-center font-medium text-gray-700 min-w-[90px]">소형견</th>
                      <th className="border border-stone-200 px-3 py-2 text-center font-medium text-gray-700 min-w-[90px]">중형견</th>
                      <th className="border border-stone-200 px-3 py-2 text-center font-medium text-gray-700 min-w-[90px]">특수견</th>
                      <th className="border border-stone-200 px-3 py-2 text-left font-medium text-gray-700">설명</th>
                      <th className="border border-stone-200 px-3 py-2 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {additionalFees.map((f, i) => (
                      <tr key={f.id} className="border-b border-stone-100 hover:bg-mimi-cream/30">
                        <td className="border border-stone-200 px-3 py-2">
                          <input
                            type="text"
                            value={f.name}
                            onChange={(e) => {
                              const next = [...additionalFees];
                              next[i] = { ...next[i], name: e.target.value };
                              setAdditionalFees(next);
                            }}
                            placeholder="항목명"
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-200"
                          />
                        </td>
                        <td className="border border-stone-200 px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={f.prices?.소형견 ?? f.price}
                              onChange={(e) => {
                                const next = [...additionalFees];
                                const v = parseInt(e.target.value) || 0;
                                const curr = next[i];
                                const base = curr.price;
                                next[i] = { ...curr, prices: { 소형견: v, 중형견: curr.prices?.중형견 ?? base, 특수견: curr.prices?.특수견 ?? base } };
                                setAdditionalFees(next);
                              }}
                              className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-center"
                            />
                            <span className="text-xs text-gray-500">원</span>
                          </div>
                        </td>
                        <td className="border border-stone-200 px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={f.prices?.중형견 ?? f.price}
                              onChange={(e) => {
                                const next = [...additionalFees];
                                const v = parseInt(e.target.value) || 0;
                                const curr = next[i];
                                const base = curr.price;
                                next[i] = { ...curr, prices: { 소형견: curr.prices?.소형견 ?? base, 중형견: v, 특수견: curr.prices?.특수견 ?? base } };
                                setAdditionalFees(next);
                              }}
                              className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-center"
                            />
                            <span className="text-xs text-gray-500">원</span>
                          </div>
                        </td>
                        <td className="border border-stone-200 px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              value={f.prices?.특수견 ?? f.price}
                              onChange={(e) => {
                                const next = [...additionalFees];
                                const v = parseInt(e.target.value) || 0;
                                const curr = next[i];
                                const base = curr.price;
                                next[i] = { ...curr, prices: { 소형견: curr.prices?.소형견 ?? base, 중형견: curr.prices?.중형견 ?? base, 특수견: v } };
                                setAdditionalFees(next);
                              }}
                              className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 text-center"
                            />
                            <span className="text-xs text-gray-500">원</span>
                          </div>
                        </td>
                        <td className="border border-stone-200 px-3 py-2">
                          <input
                            type="text"
                            value={f.description ?? ""}
                            onChange={(e) => {
                              const next = [...additionalFees];
                              next[i] = { ...next[i], description: e.target.value || undefined };
                              setAdditionalFees(next);
                            }}
                            placeholder="설명 (선택)"
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm"
                          />
                        </td>
                        <td className="border border-stone-200 px-2 py-2">
                          <button
                            onClick={() => {
                              const next = additionalFees.filter((_, j) => j !== i);
                              setAdditionalFees(next);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 items-center">
                <span className="text-sm text-gray-500">변경 시 자동 저장됩니다</span>
                <button
                  onClick={() => {
                    const newItem: AdditionalFeeItem = {
                      id: `add_${Date.now()}`,
                      name: "새 항목",
                      price: 5000,
                    };
                    const next = [...additionalFees, newItem];
                    setAdditionalFees(next);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  + 항목 추가
                </button>
                <button
                  onClick={() => { setAdditionalFees([...DEFAULT_ADDITIONAL_FEES]); }}
                  className="px-4 py-2 text-gray-600 text-sm hover:underline"
                >
                  기본값으로 초기화
                </button>
                <button
                  onClick={() => { saveAdditionalFees(additionalFees); setPricesSaved(true); }}
                  className="px-6 py-2 bg-mimi-orange text-white rounded-xl font-bold hover:bg-mimi-orange/90"
                >
                  즉시 저장
                </button>
              </div>
            </div>
            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">요금표 설정 (강아지)</h2>
              <p className="text-sm text-gray-600 mb-6">견종·체중구간별 가격을 요금표 형식으로 설정합니다.</p>
              <div className="space-y-8 overflow-x-auto">
                {SERVICE_DEFS.map((s) => {
                  const breedTable = DEFAULT_PRICE_TABLE as Record<BreedType, Record<string, Record<string, number>>>;
                  const breeds = (s.forBreed as readonly BreedType[]).slice();
                  const allTiers = ["3kg미만", "5kg미만", "7kg미만", "9kg미만", "11kg미만", "13kg미만"] as WeightTier[];
                  const tiersForBreed = (b: BreedType) =>
                    allTiers.filter((t) => breedTable[b]?.[s.id]?.[t] != null);
                  return (
                    <div key={s.id} className="p-4 bg-mimi-cream rounded-xl">
                      <h3 className="font-bold text-gray-800 mb-4">{s.name}</h3>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left py-2 px-2 border-b border-gray-200 font-medium text-gray-700">견종</th>
                            {allTiers.map((t) => (
                              <th key={t} className="py-2 px-2 border-b border-gray-200 font-medium text-gray-700 text-center min-w-[72px]">
                                {t}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {breeds.map((breedType) => {
                            const tiers = tiersForBreed(breedType);
                            if (tiers.length === 0) return null;
                            return (
                              <tr key={breedType} className="border-b border-gray-100">
                                <td className="py-2 px-2 font-medium text-gray-700">{breedType}</td>
                                {allTiers.map((weightTier) => {
                                  const hasCell = tiers.includes(weightTier);
                                  if (!hasCell) return <td key={weightTier} className="py-2 px-2 bg-gray-50/50" />;
                                  return (
                                    <td key={weightTier} className="py-2 px-2">
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="number"
                                          value={getPrice(s.id, breedType, weightTier)}
                                          onChange={(e) =>
                                            handlePriceChange(s.id, breedType, weightTier, parseInt(e.target.value) || 0)
                                          }
                                          className="w-full min-w-[64px] px-2 py-1.5 rounded-lg border border-gray-200 text-center"
                                        />
                                        <span className="text-xs text-gray-500">원</span>
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex items-center gap-4 flex-wrap">
                <span className="text-sm text-gray-500">변경 시 자동 저장됩니다</span>
                <button
                  onClick={handleSavePrices}
                  className="px-6 py-3 bg-mimi-orange text-white rounded-xl font-bold hover:bg-mimi-orange/90"
                >
                  즉시 저장
                </button>
                {pricesSaved && <span className="text-green-600 font-medium">저장되었습니다</span>}
                <button
                  onClick={() => {
                    const defaults: Record<string, number> = {};
                    for (const breedType of ["소형견", "중형견", "특수견"] as BreedType[]) {
                      const breedTable = DEFAULT_PRICE_TABLE[breedType] as Record<string, Record<string, number>>;
                      for (const serviceId of Object.keys(breedTable)) {
                        const tiers = breedTable[serviceId];
                        if (!tiers) continue;
                        for (const weightTier of Object.keys(tiers) as WeightTier[]) {
                          defaults[`${serviceId}_${breedType}_${weightTier}`] = tiers[weightTier];
                        }
                      }
                    }
                    setPrices(defaults);
                    setPricesSaved(false);
                  }}
                  className="text-gray-600 text-sm hover:underline"
                >
                  기본값으로 초기화
                </button>
              </div>
            </div>
            </div>
          )}

          {tab === "points" && (
            <div className="space-y-8">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">포인트 설정</h2>
                <p className="text-sm text-gray-600 mb-6">예약 결제 시 포인트 적립, 2회차 이상 결제 시 포인트 사용 규칙을 설정합니다.</p>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">적립률 (결제금액 1원당 포인트)</label>
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.001}
                      value={pointSettings.earnRate}
                      onChange={(e) => setPointSettings((s) => ({ ...s, earnRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">예: 0.01 = 1% (10,000원 결제 시 100P 적립)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">1포인트 = ?원 (사용 시 할인)</label>
                    <input
                      type="number"
                      min={1}
                      value={pointSettings.pointValueWon}
                      onChange={(e) => setPointSettings((s) => ({ ...s, pointValueWon: parseInt(e.target.value, 10) || 1 }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">예: 10 = 100P 사용 시 1,000원 할인</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">최대 사용 비율 (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pointSettings.maxUsePercent}
                      onChange={(e) => setPointSettings((s) => ({ ...s, maxUsePercent: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">결제금액의 몇 %까지 포인트로 할인 가능 (예: 30 = 30%)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">포인트 사용 가능 최소 이용횟수</label>
                    <input
                      type="number"
                      min={1}
                      value={pointSettings.minVisitToUse}
                      onChange={(e) => setPointSettings((s) => ({ ...s, minVisitToUse: parseInt(e.target.value, 10) || 2 }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">2 = 2회차 결제부터 포인트 사용 가능</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">포인트 유효기간 (일)</label>
                    <input
                      type="number"
                      min={0}
                      value={pointSettings.expiryDays}
                      onChange={(e) => setPointSettings((s) => ({ ...s, expiryDays: parseInt(e.target.value, 10) || 0 }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">0 = 무제한</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm text-gray-500">변경 시 자동 저장됩니다</span>
                    <button
                      onClick={() => {
                        savePointSettings(pointSettings);
                        setPointSettingsSaved(true);
                      }}
                      className="px-6 py-3 bg-mimi-orange text-white rounded-xl font-bold hover:bg-mimi-orange/90"
                    >
                      즉시 저장
                    </button>
                    {pointSettingsSaved && <span className="text-green-600 font-medium">저장되었습니다</span>}
                  </div>
                </div>
              </div>
              <div className="card p-6">
                <h3 className="font-bold text-gray-800 mb-4">고객별 포인트 수동 조정</h3>
                <p className="text-sm text-gray-600 mb-4">고객 리스트에서 연락처를 확인한 후, 아래에서 특정 고객의 포인트를 임의로 설정할 수 있습니다.</p>
                <div className="flex flex-wrap gap-3 items-end max-w-lg">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">연락처</label>
                    <input
                      type="text"
                      id="point-adjust-phone"
                      placeholder="010-1234-5678"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">설정할 포인트</label>
                    <input
                      type="number"
                      id="point-adjust-amount"
                      min={0}
                      placeholder="0"
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-24"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const phone = (document.getElementById("point-adjust-phone") as HTMLInputElement)?.value?.trim();
                      const amount = parseInt((document.getElementById("point-adjust-amount") as HTMLInputElement)?.value || "0", 10);
                      if (phone && amount >= 0) {
                        setCustomerPoints(phone, undefined, amount);
                        (document.getElementById("point-adjust-amount") as HTMLInputElement).value = "";
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    포인트 설정
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">* 고객관리 탭의 고객 리스트에서 연락처를 확인 후 입력하세요</p>
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="space-y-8">
              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">관리자 설정</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼 수수료율 (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={settings.commissionRate ?? 10}
                      onChange={(e) => setSettings((s) => ({ ...s, commissionRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">서비스총액(포인트 할인 전) 기준 수수료. 고객 포인트 사용은 정산에서 제외됩니다.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼명</label>
                    <input
                      type="text"
                      value={settings.platformName ?? ""}
                      onChange={(e) => setSettings((s) => ({ ...s, platformName: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      placeholder="미미살롱펫"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">정산 주기 (일)</label>
                    <input
                      type="number"
                      min={1}
                      value={settings.settlementCycleDays ?? 7}
                      onChange={(e) => setSettings((s) => ({ ...s, settlementCycleDays: parseInt(e.target.value) || 7 }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">정산 주기 설정 (참고용)</p>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">보낼 계좌 (송금 출금 계좌)</h3>
                    <p className="text-xs text-gray-500 mb-3">정산 시 디자이너에게 송금할 때 사용하는 플랫폼 계좌입니다.</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">은행</label>
                        <input
                          type="text"
                          value={settings.settlementBankName ?? ""}
                          onChange={(e) => setSettings((s) => ({ ...s, settlementBankName: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200"
                          placeholder="예: 국민은행"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">계좌번호</label>
                        <input
                          type="text"
                          value={settings.settlementAccountNumber ?? ""}
                          onChange={(e) => setSettings((s) => ({ ...s, settlementAccountNumber: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200"
                          placeholder="예: 123-456-789012"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">예금주</label>
                        <input
                          type="text"
                          value={settings.settlementAccountHolder ?? ""}
                          onChange={(e) => setSettings((s) => ({ ...s, settlementAccountHolder: e.target.value }))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200"
                          placeholder="예: (주)미미살롱펫"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.groomingReminderEnabled !== false}
                        onChange={(e) => setSettings((s) => ({ ...s, groomingReminderEnabled: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">미용 추천 리마인더 (1주일 전 자동 발송)</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">서비스 완료 고객에게 추천 시기 1주일 전에 자동으로 문자 발송</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">미용 추천 주기 (일)</label>
                    <input
                      type="number"
                      min={14}
                      max={90}
                      value={settings.groomingReminderIntervalDays ?? 28}
                      onChange={(e) => setSettings((s) => ({ ...s, groomingReminderIntervalDays: parseInt(e.target.value) || 28 }))}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                    />
                    <p className="text-xs text-gray-500 mt-1">완료일로부터 N일 뒤가 추천일 (기본 28일=4주), 그 7일 전에 발송</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm text-gray-500">변경 시 자동 저장됩니다</span>
                    <button
                      onClick={handleSaveSettings}
                      className="px-6 py-3 bg-mimi-orange text-white rounded-xl font-bold hover:bg-mimi-orange/90"
                    >
                      즉시 저장
                    </button>
                    {settingsSaved && <span className="text-green-600 font-medium">저장되었습니다</span>}
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">비밀번호 변경</h2>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">현재 비밀번호</label>
                    <input
                      type="password"
                      value={pwChangeCurrent}
                      onChange={(e) => setPwChangeCurrent(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      placeholder="현재 비밀번호"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호</label>
                    <input
                      type="password"
                      value={pwChangeNew}
                      onChange={(e) => setPwChangeNew(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      placeholder="6자 이상"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 확인</label>
                    <input
                      type="password"
                      value={pwChangeConfirm}
                      onChange={(e) => setPwChangeConfirm(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200"
                      placeholder="다시 입력"
                    />
                  </div>
                  {pwChangeMsg && (
                    <p className={`text-sm ${pwChangeMsg.includes("변경되었습니다") ? "text-green-600" : "text-red-600"}`}>
                      {pwChangeMsg}
                    </p>
                  )}
                  <button
                    onClick={handlePasswordChange}
                    className="px-6 py-3 bg-gray-700 text-white rounded-xl font-bold hover:bg-gray-800"
                  >
                    비밀번호 변경
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
