"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getCustomerProfile, saveCustomerProfile } from "@/lib/customer-storage";
import { getBookingsByCustomer, updateBooking } from "@/lib/groomer-storage";
import { SERVICE_DEFS } from "@/lib/services";
import { getCustomerPoints } from "@/lib/point-storage";
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
  const handleSubmit = () => {
    if (rating < 1) return;
    updateBooking(booking.id, { reviewRating: rating, reviewText: text.trim() || undefined, reviewAt: new Date().toISOString() });
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

  const profile = initialProfile ?? getCustomerProfile();

  useEffect(() => {
    setInitialProfile(getCustomerProfile());
  }, [saved]);

  const [bookingsRefresh, setBookingsRefresh] = useState(0);
  useEffect(() => {
    const p = getCustomerProfile();
    if (p?.phone || p?.email) {
      setBookings(getBookingsByCustomer(p.phone, p.email));
    }
  }, [tab, saved, bookingsRefresh, initialProfile?.phone, initialProfile?.email]);

  const handleComplete = (prof: CustomerProfile) => {
    setSaveError(null);
    const ok = saveCustomerProfile(prof);
    if (!ok) {
      setSaveError("저장에 실패했습니다. 반려동물 사진이 많거나 크면 줄여 주세요.");
      return;
    }
    setSaved(true);
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
              {profile && (
                <>
                  <div className="card p-5 mb-6">
                    <p className="font-medium text-gray-800">{profile.name}</p>
                    <p className="text-sm text-gray-600">{profile.phone}</p>
                    {profile.email && <p className="text-sm text-gray-600">{profile.email}</p>}
                    <p className="text-sm text-gray-600">{profile.address} {profile.detailAddress ?? ""}</p>
                    <p className="text-sm text-gray-500 mt-1">반려동물 {profile.pets?.length ?? 0}마리 · 총 이용 {completedCount}회 · 보유 포인트 <strong className="text-amber-600">{getCustomerPoints(profile.phone, profile.email)}P</strong></p>
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
              {!profile && (
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
              <div className="card p-4 bg-amber-50/30 border-amber-200/30">
                <p className="text-sm text-gray-600">총 예약 <strong>{bookings.length}건</strong> · 서비스완료 <strong>{completedCount}회</strong></p>
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
                        <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${
                          b.status === "paid" ? "bg-green-100 text-green-800" : b.status === "confirmed" ? "bg-blue-100 text-blue-800" : b.status === "completed" ? "bg-gray-100 text-gray-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {getStatusLabel(b.status)}
                        </span>
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
                                  <img src={url} alt={`미용 전 ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
                                </div>
                              ))}
                              {(b.afterPhotos ?? []).map((url, i) => (
                                <div key={`a-${i}`} className="shrink-0">
                                  <p className="text-xs text-gray-500 mb-1">미용 후</p>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt={`미용 후 ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {b.reviewRating != null ? (
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
