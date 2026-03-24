"use client";

import type { GroomerProfile } from "./groomer-types";
import { calcCommission, calcSettlementAmount, getServiceTotalForSettlement } from "./admin-settings";
import * as XLSX from "xlsx";

/** 정산 엑셀용 예약 타입 (groomerId 등 선택 필드 허용) */
type BookingLike = {
  date?: string;
  time?: string;
  groomerName?: string;
  serviceName?: string;
  serviceId?: string;
  petType?: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  price: number;
  pointsUsed?: number;
  serviceTotal?: number;
  settlementRequestedAt?: string;
  additionalFees?: { price: number }[];
};

export async function downloadSettlementExcel(
  _completedBookings: BookingLike[],
  unsettled: BookingLike[],
  settled: BookingLike[],
  groomers: GroomerProfile[],
  bookingsByGroomer: {
    groomer: GroomerProfile;
    completed: BookingLike[];
    revenue: number;
    commission: number;
    unsettled: BookingLike[];
    settled: BookingLike[];
    unsettledAmount: number;
    settledAmount: number;
  }[],
  commissionRate: number,
  pointValueWon: number
) {
  const unsettledNotRequested = unsettled.filter((b) => !b.settlementRequestedAt);
  const unsettledRequested = unsettled.filter((b) => !!b.settlementRequestedAt);
  const svcTotal = (b: BookingLike) => getServiceTotalForSettlement(b, pointValueWon);
  const toGroomer = (b: BookingLike) => calcSettlementAmount(svcTotal(b), commissionRate);

  const wb = XLSX.utils.book_new();

  // 1. 디자이너별 정산 요약 (미정산 | 정산요청 | 정산완료 구분)
  const summaryData = [
    ["디자이너", "완료건수", "매출(원)", "수수료(원)", "미정산건수", "미정산금액(원)", "정산요청건수", "정산요청금액(원)", "정산완료건수", "정산완료금액(원)"],
    ...bookingsByGroomer
      .filter((x) => x.groomer.id !== "_none")
      .map(({ groomer, completed, revenue, commission, unsettled: gu, settled: gs, unsettledAmount, settledAmount }) => {
        const guNotReq = gu.filter((b) => !b.settlementRequestedAt);
        const guReq = gu.filter((b) => !!b.settlementRequestedAt);
        const notReqAmt = guNotReq.reduce((s, b) => s + toGroomer(b), 0);
        const reqAmt = guReq.reduce((s, b) => s + toGroomer(b), 0);
        return [
          groomer.name,
          completed.length,
          revenue,
          commission,
          guNotReq.length,
          notReqAmt,
          guReq.length,
          reqAmt,
          gs.length,
          settledAmount,
        ];
      }),
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, "디자이너별 요약");

  const detailRow = (b: BookingLike, status: string) => {
    const st = svcTotal(b);
    const fee = calcCommission(st, commissionRate);
    const tg = calcSettlementAmount(st, commissionRate);
    return [
      b.date ?? "",
      b.time ?? "",
      b.groomerName ?? "",
      b.serviceName ?? "",
      b.customerName ?? "",
      b.customerPhone ?? "",
      b.address ?? "",
      st,
      fee,
      tg,
      status,
    ];
  };

  // 2. 미정산 상세 (정산요청 전)
  const unsettledData = [
    ["일자", "시간", "디자이너", "서비스", "고객명", "연락처", "주소", "매출(원)", "수수료(원)", "디자이너정산액(원)", "상태"],
    ...unsettledNotRequested.map((b) => detailRow(b, "미정산")),
  ];
  const wsUnsettled = XLSX.utils.aoa_to_sheet(unsettledData);
  XLSX.utils.book_append_sheet(wb, wsUnsettled, "미정산 상세");

  // 3. 정산요청 상세
  const requestedData = [
    ["일자", "시간", "디자이너", "서비스", "고객명", "연락처", "주소", "매출(원)", "수수료(원)", "디자이너정산액(원)", "상태"],
    ...unsettledRequested.map((b) => detailRow(b, "정산요청됨")),
  ];
  const wsRequested = XLSX.utils.aoa_to_sheet(requestedData);
  XLSX.utils.book_append_sheet(wb, wsRequested, "정산요청 상세");

  // 4. 정산완료 상세
  const settledData = [
    ["일자", "시간", "디자이너", "서비스", "고객명", "연락처", "주소", "매출(원)", "수수료(원)", "디자이너정산액(원)", "상태"],
    ...settled.map((b) => detailRow(b, "정산완료")),
  ];
  const wsSettled = XLSX.utils.aoa_to_sheet(settledData);
  XLSX.utils.book_append_sheet(wb, wsSettled, "정산완료 상세");

  // 5. 서비스 종류별 집계
  const byService = new Map<string, { count: number; revenue: number }>();
  for (const b of _completedBookings) {
    const label = (b.serviceName ?? "").trim() || (b.serviceId ?? "") || "기타";
    const st = svcTotal(b);
    const cur = byService.get(label) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += st;
    byService.set(label, cur);
  }
  const serviceAgg = Array.from(byService.entries())
    .map(([name, v]) => {
      const fee = calcCommission(v.revenue, commissionRate);
      const tg = calcSettlementAmount(v.revenue, commissionRate);
      return [name, v.count, v.revenue, fee, tg] as (string | number)[];
    })
    .sort((a, b) => (b[2] as number) - (a[2] as number));
  const wsByService = XLSX.utils.aoa_to_sheet([
    ["서비스", "건수", "매출(원)", "수수료(원)", "디자이너정산액(원)"],
    ...serviceAgg,
  ]);
  XLSX.utils.book_append_sheet(wb, wsByService, "서비스별 집계");

  // 6. 견종·표시 구분별 (petType)
  const byPet = new Map<string, { count: number; revenue: number }>();
  for (const b of _completedBookings) {
    const label = (b.petType ?? "").trim() || "미입력";
    const st = svcTotal(b);
    const cur = byPet.get(label) ?? { count: 0, revenue: 0 };
    cur.count += 1;
    cur.revenue += st;
    byPet.set(label, cur);
  }
  const petAgg = Array.from(byPet.entries())
    .map(([name, v]) => {
      const fee = calcCommission(v.revenue, commissionRate);
      const tg = calcSettlementAmount(v.revenue, commissionRate);
      return [name, v.count, v.revenue, fee, tg] as (string | number)[];
    })
    .sort((a, b) => (b[2] as number) - (a[2] as number));
  const wsByPet = XLSX.utils.aoa_to_sheet([
    ["구분(petType)", "건수", "매출(원)", "수수료(원)", "디자이너정산액(원)"],
    ...petAgg,
  ]);
  XLSX.utils.book_append_sheet(wb, wsByPet, "견종구분별 집계");

  // 7. 금액 구성 (기본 vs 추가요금)
  let baseSum = 0;
  let addSum = 0;
  for (const b of _completedBookings) {
    const st = svcTotal(b);
    const af = (b.additionalFees ?? []).reduce((s, x) => s + (x.price ?? 0), 0);
    addSum += af;
    baseSum += Math.max(0, st - af);
  }
  const wsComposition = XLSX.utils.aoa_to_sheet([
    ["구분", "금액(원)", "수수료(원)"],
    ["기본 서비스", baseSum, calcCommission(baseSum, commissionRate)],
    ["추가요금", addSum, calcCommission(addSum, commissionRate)],
    ["합계", baseSum + addSum, calcCommission(baseSum + addSum, commissionRate)],
  ]);
  XLSX.utils.book_append_sheet(wb, wsComposition, "금액구성");

  const fileName = `정산내역_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
