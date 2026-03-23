"use client";

import * as XLSX from "xlsx";
import type { GroomerProfile } from "./groomer-types";
import { getCustomerPoints } from "./point-storage";

function stampFilename(prefix: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${prefix}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.xlsx`;
}

/** Excel 시트 이름: 31자 이하, 금지문자 제거 */
export function sanitizeSheetName(name: string): string {
  const t = (name || "미입력").replace(/[\[\]\*\?\/\\:]/g, "_").trim();
  return t.slice(0, 31) || "시트";
}

export type CustomerExcelRow = {
  key: string;
  name: string;
  phone: string;
  email: string;
  region: string;
  visitCount: number;
  totalAmount: number;
  firstDate: string;
  lastDate: string;
  pets: string[];
  services: string[];
  type: string;
};

/** 지역(부문)별 시트로 고객 목록 저장 — 현재 이용횟수·검색 조건 반영, 지역 드롭다운만 전체로 펼침 */
export function downloadCustomerExcelByRegion(customers: CustomerExcelRow[]): void {
  const byRegion = new Map<string, CustomerExcelRow[]>();
  for (const c of customers) {
    const r = c.region || "미입력";
    if (!byRegion.has(r)) byRegion.set(r, []);
    byRegion.get(r)!.push(c);
  }
  const wb = XLSX.utils.book_new();
  const regions = Array.from(byRegion.keys()).sort((a, b) => a.localeCompare(b, "ko"));
  const header = [
    "구분",
    "이름",
    "연락처",
    "이메일",
    "지역",
    "이용횟수",
    "총금액",
    "첫방문",
    "최근방문",
    "반려동물",
    "서비스",
    "포인트",
  ];
  for (const region of regions) {
    const rows = byRegion.get(region)!;
    const aoa: (string | number)[][] = [
      header,
      ...rows.map((c) => [
        c.type,
        c.name,
        c.phone || c.key,
        c.email,
        c.region,
        c.visitCount,
        c.totalAmount,
        c.firstDate,
        c.lastDate,
        c.pets.join(", "),
        c.services.join(", "),
        getCustomerPoints(c.phone || c.key, c.email),
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(region));
  }
  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([["표시할 고객이 없습니다."]]);
    XLSX.utils.book_append_sheet(wb, ws, "안내");
  }
  XLSX.writeFile(wb, stampFilename("고객목록_부문별"));
}

/** 관리자 테이블 행과 호환 (completed/reviews는 길이만 사용) */
export type GroomerExcelRow = {
  g: GroomerProfile;
  completed: { length: number };
  avgRating: string | null;
  reviews: { length: number };
  region: string;
};

function genderLabel(g: GroomerProfile): string {
  if (g.gender === "male") return "남";
  if (g.gender === "female") return "여";
  if (g.gender === "other") return "기타";
  return "-";
}

/** 지역(부문)별 시트로 디자이너 목록 저장 */
export function downloadGroomerExcelByRegion(rows: GroomerExcelRow[]): void {
  const byRegion = new Map<string, GroomerExcelRow[]>();
  for (const x of rows) {
    const r = x.region || "미입력";
    if (!byRegion.has(r)) byRegion.set(r, []);
    byRegion.get(r)!.push(x);
  }
  const wb = XLSX.utils.book_new();
  const regions = Array.from(byRegion.keys()).sort((a, b) => a.localeCompare(b, "ko"));
  const header = [
    "이름",
    "등록일",
    "전화번호",
    "생년월일",
    "나이",
    "성별",
    "지역",
    "반경(km)",
    "경력",
    "계좌",
    "서비스수",
    "미용완료",
    "별점",
    "리뷰수",
    "상태",
    "주소",
  ];
  for (const region of regions) {
    const list = byRegion.get(region)!;
    const aoa: (string | number)[][] = [
      header,
      ...list.map((x) => {
        const g = x.g;
        const hasAcc = !!(g.bankName?.trim() && g.accountNumber?.trim());
        return [
          g.name,
          g.createdAt ? new Date(g.createdAt).toLocaleDateString("ko-KR") : "",
          g.phone || "",
          g.birthDate || "",
          g.age ?? "",
          genderLabel(g),
          x.region,
          g.radiusKm ?? 10,
          g.career ?? "",
          hasAcc ? "등록" : "미등록",
          g.services?.length ?? 0,
          x.completed.length,
          x.avgRating ?? "",
          x.reviews.length,
          g.suspended ? "예약정지" : "활동",
          g.address ?? "",
        ];
      }),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(region));
  }
  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([["표시할 디자이너가 없습니다."]]);
    XLSX.utils.book_append_sheet(wb, ws, "안내");
  }
  XLSX.writeFile(wb, stampFilename("디자이너목록_부문별"));
}
