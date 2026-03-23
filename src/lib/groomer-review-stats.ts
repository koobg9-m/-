import type { Booking } from "./groomer-types";

/** 완료 예약 중 리뷰가 있는 건만 모아 디자이너별 평균 별점·건수 */
export function groomerReviewAvgById(bookings: Booking[]): Record<string, { avg: number; count: number }> {
  const map: Record<string, number[]> = {};
  for (const b of bookings) {
    if (b.status !== "completed") continue;
    if (b.reviewRating == null || b.reviewRating < 1) continue;
    if (!map[b.groomerId]) map[b.groomerId] = [];
    map[b.groomerId].push(b.reviewRating);
  }
  const out: Record<string, { avg: number; count: number }> = {};
  for (const id of Object.keys(map)) {
    const arr = map[id];
    const sum = arr.reduce((a, x) => a + x, 0);
    out[id] = { avg: sum / arr.length, count: arr.length };
  }
  return out;
}
