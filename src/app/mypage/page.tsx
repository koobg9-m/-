"use client";

import { useState, useEffect } from "react";
import { getServiceTotalForSettlement } from "@/lib/admin-settings";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getCustomerProfile, saveCustomerProfile } from "@/lib/customer-storage";
import { getBookingsByCustomer, updateBooking } from "@/lib/groomer-storage";
import { notifyAdminBookingCancelled } from "@/lib/notify-admin-cancel-sms";
import { SERVICE_DEFS } from "@/lib/services";
import { getCustomerPoints, getPointSettings } from "@/lib/point-storage";
import CustomerProfileForm from "@/components/booking/CustomerProfileForm";
import type { CustomerProfile, Booking } from "@/lib/groomer-types";
import RequireAuth from "@/components/auth/RequireAuth";
import StarRating from "@/components/common/StarRating";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

function getStatusLabel(s: string): string {
  const map: Record<string, string> = { pending: "대기", paid: "결제완료", confirmed: "예약확정", completed: "서비스완료", cancelled: "취소" };
  return map[s] ?? s;
}

function BookingReviewForm({ booking, onSaved }: { booking: Booking; onSaved: () => void }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const handleSubmit = async () => {
    if (rating < 1) return;
    await updateBooking(booking.id, { reviewRating: rating, reviewText: text.trim() || undefined, reviewAt: new Date().toISOString() });
    onSaved();
  };
  return (
    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
      <p className="text-xs text-gray-600 mb-2">⭐ 이용후기를 남겨 주세요</p>
      <StarRating value={rating} onChange={setRating} size="lg" />
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="서비스는 어떠셨나요? (선택)"
        rows={2}
        className="mt-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none"
      />
      <button onClick={handleSubmit} disabled={rating < 1} className="mt-2 px-4 py-2 bg-mimi-orange text-white rounded-lg text-sm font-medium disabled:opacity-50">
        후기 등록
      </button>
    </div>
  );
}

function formatBookingPets(b: Booking): string {
  if (b.pets?.length) {
    return b.pets.map((p) => `${p.name} (${p.species})`).join(", ");
  }
  return `${b.petName} (${b.petType})`;
}

/** 서비스 전·예약 확정 전까지 고객이 직접 취소 가능 */
function canCustomerCancelBooking(b: Booking): boolean {
  const s = b.status;
  return s === "pending" || s === "paid" || s === "confirmed";
}

function bookingServiceSummaryLines(b: Booking, pointValueWon: number): { label: string; value: string }[] {
  const lines: { label: string; value: string }[] = [
    { label: "서비스", value: b.serviceName || "—" },
    { label: "일시", value: `${b.date ?? "—"} ${b.time ?? ""}`.trim() },
    { label: "반려동물", value: formatBookingPets(b) },
    { label: "디자이너", value: b.groomerName || "—" },
    { label: "방문 주소", value: b.address || "—" },
  ];
  const st = getServiceTotalForSettlement(b, pointValueWon);
  lines.push({ label: "서비스 금액(참고)", value: `${st.toLocaleString()}원` });
  if ((b.pointsUsed ?? 0) > 0) {
    lines.push({ label: "포인트 사용", value: `${b.pointsUsed}P (약 ${((b.pointsUsed ?? 0) * pointValueWon).toLocaleString()}원)` });
  }
  lines.push({ label: "결제 금액", value: `${(b.price ?? 0).toLocaleString()}원` });
  if (b.additionalFees && b.additionalFees.length > 0) {
    lines.push({
      label: "추가 요금 항목",
      value: b.additionalFees.map((f) => `${f.name} ${f.price.toLocaleString()}원`).join(", "),
    });
  }
  lines.push({ label: "예약 상태", value: getStatusLabel(b.status) });
  return lines;
}

function MypageContent() {
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialProfile, setInitialProfile] = useState<CustomerProfile | null>(null);
  const [tab, setTab] = useState<"overview" | "profile" | "bookings">("overview");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const t = p.get("tab");
    if (t === "profile" || t === "bookings") setTab(t);
  }, []);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [photoModal, setPhotoModal] = useState<null | { url: string; title: string }>(null);

  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  useEffect(() => {
    getCustomerProfile().then((p) => {
      setInitialProfile(p);
      setProfile(p ?? null);
    });
  }, [saved]);

  const [bookingsRefresh, setBookingsRefresh] = useState(0);
  const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelConfirmAck, setCancelConfirmAck] = useState(false);
  const pointValueWon = getPointSettings().pointValueWon ?? 1;

  useEffect(() => {
    setCancelConfirmAck(false);
  }, [cancelModalBooking?.id]);

  useEffect(() => {
    getCustomerProfile().then((p) => {
      if (p?.phone || p?.email) {
        return getBookingsByCustomer(p.phone, p.email).then(setBookings);
      }
      setBookings([]);
    });
  }, [tab, saved, bookingsRefresh, initialProfile?.phone, initialProfile?.email]);

  const displayProfile = initialProfile ?? profile;

  const handleComplete = async (prof: CustomerProfile) => {
    setSaveError(null);
    const ok = await saveCustomerProfile(prof);
    if (!ok) {
      setSaveError("저장에 실패했습니다. 반려동물 사진이 많거나 크면 줄여 주세요.");
      return;
    }
    setSaved(true);
  };

  const refreshBookingsList = async () => {
    const p = await getCustomerProfile();
    if (p?.phone || p?.email) {
      const list = await getBookingsByCustomer(p.phone, p.email);
      setBookings(list);
    } else {
      setBookingsRefresh((k) => k + 1);
    }
  };

  const handleConfirmCancelFromModal = async () => {
    const b = cancelModalBooking;
    if (!b || !cancelConfirmAck || !canCustomerCancelBooking(b)) return;
    setCancelLoadingId(b.id);
    try {
      const ok = await updateBooking(b.id, { status: "cancelled" });
      if (ok) {
        setCancelModalBooking(null);
        await refreshBookingsList();
        const sms = await notifyAdminBookingCancelled(b);
        if (sms.ok) {
          alert("예약이 취소되었습니다.");
        } else {
          alert(
            `예약은 취소되었습니다.\n\n관리자 알림 문자 발송에 실패했습니다.\n(${sms.error ?? "알 수 없음"})`
          );
        }
      } else {
        alert("취소 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setCancelLoadingId(null);
    }
  };

  const completedBookings = bookings.filter((b) => b.status === "completed");
  const completedCount = completedBookings.length;

  /** 미용 현황 상세 분석 */
  const serviceBreakdown = SERVICE_DEFS.map((s) => ({
    name: s.name,
    count: completedBookings.filter((b) => b.serviceId === s.id || b.serviceName === s.name).length,
  })).filter((x) => x.count > 0);
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: `${d.getMonth() + 1}월` };
  });
  const monthlyUsage = last6Months.map(({ key, label }) => ({
    label,
    value: completedBookings.filter((b) => (b.date ?? "").startsWith(key)).length,
  }));
  const sortedByDate = [...completedBookings].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
  let avgIntervalDays = 0;
  if (sortedByDate.length >= 2) {
    const intervals: number[] = [];
    for (let i = 1; i < sortedByDate.length; i++) {
      const prev = new Date(sortedByDate[i - 1]!.date!).getTime();
      const curr = new Date(sortedByDate[i]!.date!).getTime();
      intervals.push(Math.round((curr - prev) / (1000 * 60 * 60 * 24)));
    }
    avgIntervalDays = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
  }
  const lastVisit = sortedByDate[sortedByDate.length - 1];
  const nextRecommended = lastVisit && avgIntervalDays > 0
    ? (() => {
        const last = new Date(lastVisit.date!);
        last.setDate(last.getDate() + avgIntervalDays);
        return last.toISOString().slice(0, 10);
      })()
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <main className="flex-1">
        <div className="page-container py-8 md:py-12">
          <div className="content-container">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-mimi-slate hover:text-mimi-primary transition-colors mb-6">← 홈으로</Link>
            <h1 className="section-title mb-8">마이페이지</h1>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setTab("overview")}
              className={`tab-btn ${tab === "overview" ? "tab-btn-active" : "tab-btn-inactive"}`}
            >
              마이페이지
            </button>
            <button
              onClick={() => setTab("profile")}
              className={`tab-btn ${tab === "profile" ? "tab-btn-active" : "tab-btn-inactive"}`}
            >
              내 정보
            </button>
            <button
              onClick={() => setTab("bookings")}
              className={`tab-btn ${tab === "bookings" ? "tab-btn-active" : "tab-btn-inactive"}`}
            >
              예약 내역 ({bookings.length})
            </button>
          </div>

          {tab === "overview" && (
            <>
              {displayProfile && (
                <>
                  <div className="card p-5 mb-6">
                    <p className="font-medium text-gray-800">{displayProfile.name}</p>
                    <p className="text-sm text-gray-600">{displayProfile.phone}</p>
                    {displayProfile.email && <p className="text-sm text-gray-600">{displayProfile.email}</p>}
                    <p className="text-sm text-gray-600">{displayProfile.address} {displayProfile.detailAddress ?? ""}</p>
                    <p className="text-sm text-gray-500 mt-1">반려동물 {displayProfile.pets?.length ?? 0}마리 · 총 이용 {completedCount}회 · 보유 포인트 <strong className="text-amber-600">{getCustomerPoints(displayProfile.phone, displayProfile.email)}P</strong></p>
                  </div>
                  {completedCount > 0 && (
                    <div className="card p-6 mb-6">
                      <h3 className="font-bold text-gray-800 mb-4">📊 미용 현황 분석</h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">서비스별 이용 현황</h4>
                          {serviceBreakdown.length > 0 ? (
                            <div className="space-y-2">
                              {serviceBreakdown.map((s) => (
                                <div key={s.name} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-600">{s.name}</span>
                                  <span className="font-medium text-mimi-orange">{s.count}회</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">완료된 예약이 없습니다</p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">최근 6개월 이용 추이</h4>
                          <div className="flex gap-2 flex-wrap">
                            {monthlyUsage.map((m) => (
                              <div key={m.label} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                                <span className="text-sm text-gray-600">{m.label}</span>
                                <span className="font-medium">{m.value}회</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {(avgIntervalDays > 0 || nextRecommended) && (
                          <div className="pt-3 border-t border-gray-100 space-y-1">
                            {avgIntervalDays > 0 && (
                              <p className="text-sm text-gray-600">평균 이용 간격: <strong>{avgIntervalDays}일</strong></p>
                            )}
                            {nextRecommended && (
                              <p className="text-sm text-mimi-orange">다음 미용 추천 시기: <strong>{nextRecommended}</strong></p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              {!displayProfile && (
                <div className="card p-8 text-center text-gray-600">
                  <p>프로필이 없습니다. 내 정보에서 등록해 주세요.</p>
                  <button onClick={() => setTab("profile")} className="mt-4 text-mimi-orange hover:underline font-medium">내 정보 등록하기 →</button>
                </div>
              )}
            </>
          )}

          {tab === "profile" && (
            <>
              {saved ? (
                <div className="card p-6 bg-amber-50/50 border-amber-200/50 text-center space-y-4">
                  <span className="text-4xl">✅</span>
                  <p className="mt-2 font-medium">저장되었습니다</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      onClick={() => setSaved(false)}
                      className="px-4 py-2 text-mimi-orange border-2 border-mimi-orange rounded-lg font-medium hover:bg-mimi-orange/10"
                    >
                      다시 수정
                    </button>
                    <Link href="/booking" className="inline-block px-4 py-2 bg-mimi-orange text-white rounded-lg font-medium hover:bg-mimi-orange/90 text-center">
                      예약하기
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {saveError && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm">
                      {saveError}
                    </div>
                  )}
                  <CustomerProfileForm
                    onComplete={handleComplete}
                    initialData={initialProfile ?? undefined}
                    submitLabel="저장"
                  />
                </>
              )}
            </>
          )}

          {tab === "bookings" && (
            <div className="space-y-4">
              <div className="card p-4 bg-amber-50/30 border-amber-200/30 space-y-1">
                <p className="text-sm text-gray-600">총 예약 <strong>{bookings.length}건</strong> · 서비스완료 <strong>{completedCount}회</strong></p>
                <p className="text-xs text-gray-500">
                  취소하려면 예약 카드에서 <strong className="text-gray-700">예약 취소</strong>를 누른 뒤, 열리는 화면에서 <strong className="text-gray-700">예약 내용을 확인</strong>하고 취소 여부를 결정해 주세요. 서비스 완료 후에는 취소할 수 없습니다.{" "}
                  <Link href="/pricing" className="text-mimi-orange hover:underline">
                    취소·환불 안내
                  </Link>
                </p>
              </div>
              {bookings.length === 0 ? (
                <div className="card p-8 text-center text-gray-600">
                  <p>예약 내역이 없습니다</p>
                  <Link href="/booking" className="inline-block mt-4 text-mimi-orange hover:underline">예약하기 →</Link>
                </div>
              ) : (
                bookings.map((b) => (
                  <div key={b.id} className="card p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800">{b.serviceName}</p>
                        <p className="text-sm text-gray-600">{b.date} {b.time}</p>
                        <p className="text-sm text-gray-600">{formatBookingPets(b)}</p>
                        <p className="text-sm text-gray-600">{b.groomerName} · {b.address}</p>
                        {b.customerNotifiedAt && (
                          <p className="text-xs text-green-600 mt-1">✓ 디자이너가 확인·예약확정을 통보했습니다</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-mimi-orange">{b.price?.toLocaleString()}원</p>
                        <span
                          className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${
                            b.status === "paid"
                              ? "bg-green-100 text-green-800"
                              : b.status === "confirmed"
                                ? "bg-blue-100 text-blue-800"
                                : b.status === "completed"
                                  ? "bg-gray-100 text-gray-700"
                                  : b.status === "cancelled"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {getStatusLabel(b.status)}
                        </span>
                        {canCustomerCancelBooking(b) && (
                          <button
                            type="button"
                            onClick={() => setCancelModalBooking(b)}
                            disabled={cancelLoadingId === b.id}
                            className="mt-2 block w-full sm:w-auto sm:ml-auto px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-60"
                          >
                            예약 취소
                          </button>
                        )}
                      </div>
                    </div>
                    {b.status === "completed" && (
                      <div className="mt-4 pt-4 border-t border-stone-200 space-y-4">
                        {((b.beforePhotos?.length ?? 0) > 0 || (b.afterPhotos?.length ?? 0) > 0) && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">📷 미용 전후 사진</p>
                            <div className="flex gap-4 overflow-x-auto pb-2">
                              {(b.beforePhotos ?? []).map((url, i) => (
                                <div key={`b-${i}`} className="shrink-0">
                                  <p className="text-xs text-gray-500 mb-1">미용 전</p>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={url}
                                        alt={`미용 전 ${i + 1}`}
                                        className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-90"
                                        onClick={() => setPhotoModal({ url, title: `미용 전 ${i + 1}` })}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") setPhotoModal({ url, title: `미용 전 ${i + 1}` });
                                        }}
                                      />
                                </div>
                              ))}
                              {(b.afterPhotos ?? []).map((url, i) => (
                                <div key={`a-${i}`} className="shrink-0">
                                  <p className="text-xs text-gray-500 mb-1">미용 후</p>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={url}
                                        alt={`미용 후 ${i + 1}`}
                                        className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-90"
                                        onClick={() => setPhotoModal({ url, title: `미용 후 ${i + 1}` })}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" || e.key === " ") setPhotoModal({ url, title: `미용 후 ${i + 1}` });
                                        }}
                                      />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {b.reviewRating != null && b.reviewRating >= 1 ? (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">⭐ 이용후기</p>
                            <StarRating value={b.reviewRating} readonly size="sm" />
                            {b.reviewText && <p className="text-sm text-gray-700 mt-1">{b.reviewText}</p>}
                          </div>
                        ) : (
                          <BookingReviewForm booking={b} onSaved={() => setBookingsRefresh((k) => k + 1)} />
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
          </div>
        </div>
      </main>
      {cancelModalBooking && canCustomerCancelBooking(cancelModalBooking) && (
        <div
          className="fixed inset-0 z-[1250] bg-black/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-modal-title"
          onClick={() => {
            if (!cancelLoadingId) setCancelModalBooking(null);
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="cancel-modal-title" className="text-lg font-bold text-gray-800">
              예약 내용 확인
            </h3>
            <p className="text-sm text-gray-600 mt-1 mb-4">
              취소하기 전에 아래 예약 정보를 확인한 뒤, 취소 여부를 결정해 주세요.
            </p>
            <dl className="space-y-2 text-sm border border-stone-100 rounded-xl p-4 bg-stone-50/80">
              {bookingServiceSummaryLines(cancelModalBooking, pointValueWon).map((row) => (
                <div key={row.label} className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-4 border-b border-stone-100/80 last:border-0 pb-2 last:pb-0">
                  <dt className="text-gray-500 shrink-0">{row.label}</dt>
                  <dd className="text-gray-900 font-medium text-right sm:text-left break-words">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-gray-500 mt-3">
              환불 비율 등은{" "}
              <Link
                href="/pricing"
                className="text-mimi-orange font-medium hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                상세 요금표 · 취소·환불 안내
              </Link>
              를 참고해 주세요.
            </p>
            <label className="mt-4 flex items-start gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                className="mt-1 rounded border-gray-300 text-mimi-orange focus:ring-mimi-orange"
                checked={cancelConfirmAck}
                onChange={(e) => setCancelConfirmAck(e.target.checked)}
              />
              <span>위 예약 정보를 확인했으며, 이 예약을 취소합니다.</span>
            </label>
            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!cancelLoadingId) setCancelModalBooking(null);
                }}
                disabled={!!cancelLoadingId}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-800 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                돌아가기
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmCancelFromModal()}
                disabled={!cancelConfirmAck || cancelLoadingId === cancelModalBooking.id}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelLoadingId === cancelModalBooking.id ? "처리 중…" : "예약 취소 확정"}
              </button>
            </div>
          </div>
        </div>
      )}
      {photoModal && (
        <div
          className="fixed inset-0 z-[1200] bg-black/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="사진 확대"
          onClick={() => setPhotoModal(null)}
        >
          <div
            className="max-w-[92vw] max-h-[86vh] bg-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center text-white/90 mb-2 text-sm font-medium">{photoModal.title}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoModal.url}
              alt={photoModal.title}
              className="max-w-[92vw] max-h-[78vh] object-contain rounded-lg border border-white/20 bg-black/10"
            />
            <button
              type="button"
              onClick={() => setPhotoModal(null)}
              className="mt-3 w-full py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/15"
            >
              닫기
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default function MypagePage() {
  return (
    <RequireAuth>
      <MypageContent />
    </RequireAuth>
  );
}
