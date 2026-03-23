"use client";

import type { GroomerProfile } from "@/lib/groomer-types";
import StarRating from "@/components/common/StarRating";

function displayAge(g: GroomerProfile): string | null {
  if (typeof g.age === "number" && g.age > 0) return `${g.age}세`;
  if (g.birthDate) {
    const d = new Date(g.birthDate + "T12:00:00");
    if (Number.isNaN(d.getTime())) return null;
    let age = new Date().getFullYear() - d.getFullYear();
    const md = new Date().getMonth() - d.getMonth();
    if (md < 0 || (md === 0 && new Date().getDate() < d.getDate())) age--;
    return age > 0 ? `${age}세` : null;
  }
  return null;
}

type Props = {
  groomer: GroomerProfile;
  /** 평균 별점 (1~5), 없으면 미표시 */
  avgRating?: number | null;
  reviewCount?: number;
  /** 카드 패딩·제목 크기 */
  size?: "md" | "sm";
};

/**
 * 고객 예약 흐름용 — 이름·나이·경력·사진·소개·별점만 노출 (연락처·주소·계좌 등 제외)
 */
export default function GroomerBookingPreview({ groomer, avgRating, reviewCount, size = "md" }: Props) {
  const ageStr = displayAge(groomer);
  const pad = size === "sm" ? "p-3" : "p-4";
  const imgSize = size === "sm" ? "w-16 h-16" : "w-20 h-20";
  const titleCls = size === "sm" ? "text-base" : "text-lg";

  return (
    <div className={`rounded-2xl border-2 border-stone-200 bg-white ${pad}`}>
      <div className="flex gap-3 sm:gap-4 min-w-0">
        <div className="shrink-0">
          {groomer.photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={groomer.photoUrl} alt="" className={`${imgSize} rounded-full object-cover ring-2 ring-stone-100`} />
          ) : (
            <div className={`${imgSize} rounded-full bg-gradient-to-br from-mimi-orange/20 to-amber-100 flex items-center justify-center text-3xl`} aria-hidden>
              ✂️
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className={`font-bold text-gray-900 ${titleCls} leading-tight`}>{groomer.name}</h3>
          {ageStr && <p className="text-sm text-gray-600 mt-0.5">나이 {ageStr}</p>}
          {groomer.career && (
            <p className="text-sm text-gray-700 mt-1.5 leading-snug whitespace-pre-wrap break-words">{groomer.career}</p>
          )}
          {avgRating != null && avgRating > 0 && Number.isFinite(avgRating) && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StarRating value={Math.min(5, Math.max(1, Math.round(avgRating)))} readonly size="sm" />
              <span className="text-sm font-semibold text-amber-700">{avgRating.toFixed(1)}</span>
              {typeof reviewCount === "number" && reviewCount > 0 && (
                <span className="text-xs text-gray-500">({reviewCount}개 리뷰)</span>
              )}
            </div>
          )}
        </div>
      </div>
      {groomer.intro?.trim() && (
        <div className="mt-3 pt-3 border-t border-stone-100">
          <p className="text-xs font-medium text-gray-500 mb-1">자기소개</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{groomer.intro.trim()}</p>
        </div>
      )}
    </div>
  );
}
