"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getGroomerById, getGroomerProfiles, saveGroomerProfile, getBookings, updateBooking, buildAllServiceItemsForGroomer } from "@/lib/groomer-storage";
import type { GroomerProfile, AvailableSlot, Booking } from "@/lib/groomer-types";
import { verifyPassword } from "@/lib/auth-utils";
import GroomerAutoLogin, { setGroomerAutoLogin, isGroomerAutoLoginEnabled, clearGroomerAutoLogin } from "@/components/groomer/GroomerAutoLogin";

function formatBookingPets(b: { pets?: { name: string; species: string; healthConditions?: string; isAggressive?: boolean }[]; petName: string; petType: string; petHealthConditions?: string; petIsAggressive?: boolean }): string {
  if (b.pets?.length) {
    return b.pets.map((p) => `${p.name} (${p.species})${p.healthConditions ? ` · 지병: ${p.healthConditions}` : ""}${p.isAggressive ? " · ⚠️사나움" : ""}`).join(" / ");
  }
  return `${b.petName} (${b.petType})${b.petHealthConditions ? ` · 지병: ${b.petHealthConditions}` : ""}${b.petIsAggressive ? " · ⚠️사나움" : ""}`;
}
import { TIME_SLOTS, hydrateServicesFromRemote } from "@/lib/services";
import AddressSearchInput from "@/components/common/AddressSearchInput";
import GroomerProfilePhotoInput from "@/components/groomer/GroomerProfilePhotoInput";
import StarRating from "@/components/common/StarRating";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

const MY_GROOMER_KEY = "mimi_my_groomer_id";
const GROOMER_AUTH_KEY = "mimi_groomer_authenticated";

function normalizePhone(p: string): string {
  return (p ?? "").replace(/\D/g, "");
}

function getStatusLabel(s: string): string {
  const map: Record<string, string> = { pending: "대기", paid: "결제완료", confirmed: "예약확정", completed: "서비스완료", cancelled: "취소" };
  return map[s] ?? s;
}

/** 결재 시각(createdAt) 이후 경과 시간을 30분 단위로 표시 */
function getElapsedSincePayment(createdAt: string): { minutes: number; label: string } | null {
  if (!createdAt) return null;
  const paid = new Date(createdAt).getTime();
  const now = Date.now();
  const minutes = Math.floor((now - paid) / 60000);
  if (minutes < 0) return null;
  const interval30 = Math.floor(minutes / 30) * 30;
  if (interval30 === 0) return { minutes, label: "방금 결재" };
  if (interval30 < 60) return { minutes, label: `결재 후 ${interval30}분` };
  const hours = Math.floor(interval30 / 60);
  const mins = interval30 % 60;
  const label = mins > 0 ? `결재 후 ${hours}시간 ${mins}분` : `결재 후 ${hours}시간`;
  return { minutes, label };
}

function formatDateTime(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** 생년월일(YYYY-MM-DD)로 나이 계산 */
function getAgeFromBirthDate(birthDate: string): number | undefined {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18 ? age : undefined;
}

/** 나이로 생년월일 추정 (예: 30 → 1995년 1월 1일) */
function getBirthDateFromAge(age: number): string {
  const y = new Date().getFullYear() - age;
  return `${y}-01-01`;
}

function BookingPhotoUpload({ booking, onUpdate }: { booking: Booking; onUpdate: () => void }) {
  const [uploading, setUploading] = useState(false);
  const beforePhotos = booking.beforePhotos ?? [];
  const afterPhotos = booking.afterPhotos ?? [];

  const handleFile = (type: "before" | "after") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const maxAdd = 5 - (type === "before" ? beforePhotos.length : afterPhotos.length);
    if (maxAdd <= 0) return;
    setUploading(true);
    const toProcess = files.filter((f) => f.type.startsWith("image/")).slice(0, maxAdd);
    Promise.all(toProcess.map((f) => new Promise<string>((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(f);
    }))).then(async (urls) => {
      const list = type === "before" ? [...beforePhotos, ...urls] : [...afterPhotos, ...urls];
      await updateBooking(booking.id, type === "before" ? { beforePhotos: list.slice(0, 5) } : { afterPhotos: list.slice(0, 5) });
      onUpdate();
    }).finally(() => setUploading(false));
    e.target.value = "";
  };

  const removePhoto = async (type: "before" | "after", idx: number) => {
    const list = type === "before" ? [...beforePhotos] : [...afterPhotos];
    list.splice(idx, 1);
    await updateBooking(booking.id, type === "before" ? { beforePhotos: list } : { afterPhotos: list });
    onUpdate();
  };

  return (
    <div className="mt-4 pt-4 border-t border-stone-200">
      <h4 className="font-medium text-gray-800 mb-3">📷 미용 전후 사진</h4>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 mb-2">미용 전</p>
          <div className="flex flex-wrap gap-2">
            {beforePhotos.map((url, i) => (
              <div key={i} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`미용 전 ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border" />
                <button type="button" onClick={() => removePhoto("before", i)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none opacity-0 group-hover:opacity-100">&times;</button>
              </div>
            ))}
            {beforePhotos.length < 5 && (
              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:border-mimi-primary/50 text-gray-400 hover:text-mimi-primary text-2xl">
                <input type="file" accept="image/*" multiple onChange={handleFile("before")} className="hidden" disabled={uploading} />
                +
              </label>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2">미용 후</p>
          <div className="flex flex-wrap gap-2">
            {afterPhotos.map((url, i) => (
              <div key={i} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`미용 후 ${i + 1}`} className="w-16 h-16 object-cover rounded-lg border" />
                <button type="button" onClick={() => removePhoto("after", i)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none opacity-0 group-hover:opacity-100">&times;</button>
              </div>
            ))}
            {afterPhotos.length < 5 && (
              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-stone-300 flex items-center justify-center cursor-pointer hover:border-mimi-primary/50 text-gray-400 hover:text-mimi-primary text-2xl">
                <input type="file" accept="image/*" multiple onChange={handleFile("after")} className="hidden" disabled={uploading} />
                +
              </label>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getNextDays(count: number) {
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function GroomerPage() {
  const [myId, setMyId] = useState<string | null>(null);
  const [profile, setProfile] = useState<GroomerProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState<"dashboard" | "setup">("dashboard");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const loadProfile = async () => {
    const id = localStorage.getItem(MY_GROOMER_KEY);
    setMyId(id);
    if (id) {
      const [p, allBookings] = await Promise.all([getGroomerById(id), getBookings()]);
      setProfile(p ?? null);
      setBookings(allBookings.filter((b) => b.groomerId === id));
      const auth = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(GROOMER_AUTH_KEY) : null;
      setAuthenticated(!!p?.passwordHash && auth === id);
    } else {
      setAuthenticated(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      await hydrateServicesFromRemote();
      await loadProfile();
      
      // 자동 로그인 설정 확인
      setAutoLogin(isGroomerAutoLoginEnabled());
    })();
  }, []);

  useEffect(() => {
    if (tab === "dashboard" && myId) {
      Promise.all([getGroomerById(myId), getBookings()]).then(([p, allBookings]) => {
        if (p) setProfile(p);
        setBookings(allBookings.filter((b) => b.groomerId === myId));
      });
    }
  }, [tab, myId]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.passwordHash || !myId) return;
    setPasswordError("");
    const ok = await verifyPassword(passwordInput.trim(), (profile.passwordHash ?? "").trim());
    if (ok) {
      sessionStorage.setItem(GROOMER_AUTH_KEY, myId);
      setAuthenticated(true);
      
      // 자동 로그인 설정
      if (autoLogin) {
        setGroomerAutoLogin(myId, passwordInput, true);
      } else {
        clearGroomerAutoLogin();
      }
      
      setPasswordInput("");
    } else {
      setPasswordError("비밀번호가 올바르지 않습니다.");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(GROOMER_AUTH_KEY);
    clearGroomerAutoLogin();
    setAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-mimi-cream">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <p className="text-gray-500">로딩 중...</p>
        </main>
        <Footer />
      </div>
    );
  }

  const handleReturningLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    // 예기치 않은 기존 인증 상태가 남아있지 않도록 선제 정리
    sessionStorage.removeItem(GROOMER_AUTH_KEY);
    const phoneNorm = normalizePhone(loginPhone);
    if (!phoneNorm) {
      setLoginError("연락처를 입력해 주세요.");
      return;
    }
    const profiles = await getGroomerProfiles();
    const samePhone = profiles.filter((p) => normalizePhone(p.phone ?? "") === phoneNorm);
    // 동일 전화로 중복 행이 있을 때, 비밀번호가 설정된 프로필을 우선 (옛 로컬 스냅샷만 매칭되는 경우 방지)
    const found =
      samePhone.find((p) => typeof p.passwordHash === "string" && p.passwordHash.trim().length > 0) ?? samePhone[0];
    if (!found) {
      setLoginError("등록된 디자이너를 찾을 수 없습니다. 연락처를 확인해 주세요.");
      return;
    }
    const foundPhoneNorm = normalizePhone(found.phone ?? "");
    if (!foundPhoneNorm || foundPhoneNorm !== phoneNorm) {
      setLoginError("연락처가 일치하지 않아 로그인할 수 없습니다.");
      return;
    }
    if (!found.passwordHash) {
      setLoginError("비밀번호가 아직 부여되지 않았습니다. 관리자에게 문의해 주세요.");
      return;
    }
    const ok = await verifyPassword(loginPassword.trim(), (found.passwordHash ?? "").trim());
    if (ok) {
      localStorage.setItem(MY_GROOMER_KEY, found.id);
      sessionStorage.setItem(GROOMER_AUTH_KEY, found.id);
      setShowLogin(false);
      setLoginPhone("");
      setLoginPassword("");
      loadProfile();
    } else {
      setLoginError("비밀번호가 올바르지 않습니다.");
    }
  };

  if (!myId || !profile) {
    return (
      <div className="min-h-screen flex flex-col bg-mimi-cream">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center py-16 px-6">
          <div className="w-full max-w-md text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">디자이너</h1>
            <p className="text-gray-600 mb-6">미미살롱펫 디자이너로 활동하시려면 신청하거나 로그인하세요.</p>

            {!showLogin ? (
              <>
                <Link href="/groomer/register" className="block w-full py-4 bg-mimi-orange text-white rounded-xl font-bold text-lg hover:bg-mimi-orange/90">
                  디자이너 신청하기
                </Link>
                <button
                  type="button"
                  onClick={() => setShowLogin(true)}
                  className="block w-full mt-3 py-4 bg-white text-mimi-orange border-2 border-mimi-orange rounded-xl font-bold text-lg hover:bg-mimi-orange/5"
                >
                  디자이너 로그인 (복귀)
                </button>
              </>
            ) : (
              <div className="card p-6 text-left">
                <h2 className="text-lg font-bold text-gray-800 mb-4">디자이너 로그인</h2>
                <p className="text-sm text-gray-600 mb-4">신청 시 등록한 연락처와 관리자가 부여한 비밀번호를 입력하세요.</p>
                <form onSubmit={handleReturningLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <input
                      type="tel"
                      value={loginPhone}
                      onChange={(e) => { setLoginPhone(e.target.value); setLoginError(""); }}
                      placeholder="010-1234-5678"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => { setLoginPassword(e.target.value); setLoginError(""); }}
                        placeholder="비밀번호"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none pr-12"
                      />
                      <button
                        type="button"
                        aria-label={showLoginPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                        onClick={() => setShowLoginPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showLoginPassword ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                            <path d="M3 3l18 18" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  {loginError && <p className="text-sm text-red-600">{loginError}</p>}
                  <button type="submit" className="w-full py-3 bg-mimi-orange text-white rounded-xl font-bold">
                    로그인
                  </button>
                </form>
                <button type="button" onClick={() => { setShowLogin(false); setLoginError(""); }} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700">
                  ← 신청하기로 돌아가기
                </button>
              </div>
            )}

            <Link href="/" className="block mt-4 text-sm text-gray-500 hover:text-gray-700">
              ← 홈으로
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile.passwordHash && authenticated === false) {
    return (
      <div className="min-h-screen flex flex-col bg-mimi-cream">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="w-full max-w-sm card p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2">비밀번호 부여 대기</h2>
            <p className="text-sm text-gray-600 mb-4">{profile.name}님, 신청이 접수되었습니다. 관리자가 비밀번호를 부여하면 서비스 개시됩니다. 관리자에게 비밀번호 부여를 요청해 주세요.</p>
            <Link href="/" className="block w-full py-3 bg-mimi-orange text-white rounded-xl font-bold text-center">
              홈으로
            </Link>
            <button onClick={() => { localStorage.removeItem(MY_GROOMER_KEY); sessionStorage.removeItem(GROOMER_AUTH_KEY); window.location.reload(); }} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700">
              다른 계정으로 로그인
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (profile.passwordHash && authenticated === false) {
  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <GroomerAutoLogin />
      <main className="flex-1 flex items-center justify-center py-16">
        <div className="w-full max-w-sm card p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">디자이너 로그인</h2>
          <p className="text-sm text-gray-600 mb-4">{profile.name}님의 대시보드에 접근하려면 관리자가 부여한 비밀번호를 입력하세요.</p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPasswordInput ? "text" : "password"}
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }}
                placeholder="비밀번호"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none pr-12"
                autoFocus
              />
              <button
                type="button"
                aria-label={showPasswordInput ? "비밀번호 숨기기" : "비밀번호 보기"}
                onClick={() => setShowPasswordInput((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPasswordInput ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                    <path d="M3 3l18 18" />
                  </svg>
                )}
              </button>
            </div>
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoLogin"
                checked={autoLogin}
                onChange={(e) => setAutoLogin(e.target.checked)}
                className="w-4 h-4 text-mimi-orange border-gray-300 rounded focus:ring-mimi-orange"
              />
              <label htmlFor="autoLogin" className="ml-2 text-sm text-gray-600">
                자동 로그인
              </label>
            </div>
            
            <button type="submit" className="w-full py-3 bg-mimi-orange text-white rounded-xl font-bold">
              로그인
            </button>
          </form>
          <button onClick={() => { localStorage.removeItem(MY_GROOMER_KEY); sessionStorage.removeItem(GROOMER_AUTH_KEY); clearGroomerAutoLogin(); window.location.reload(); }} className="mt-4 w-full text-sm text-gray-500 hover:text-gray-700">
            다른 계정으로 로그인
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <GroomerAutoLogin />
      <main className="flex-1 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
            <Link href="/" className="text-mimi-orange hover:underline mb-4 inline-block">← 홈으로</Link>
            <div className="flex justify-between items-center mb-8">
              <h1 className="section-title">디자이너 대시보드</h1>
              <div className="flex gap-2 items-center">
                <button onClick={() => setTab(tab === "dashboard" ? "setup" : "dashboard")} className="tab-btn tab-btn-inactive">
                  {tab === "dashboard" ? "프로필 수정" : "대시보드"}
                </button>
                {profile.passwordHash && (
                  <button onClick={handleLogout} className="text-gray-500 hover:text-gray-700 text-sm px-2 py-2">
                    로그아웃
                  </button>
                )}
              </div>
            </div>

          {tab === "dashboard" ? (
            <GroomerDashboard profile={profile} bookings={bookings} onRefresh={loadProfile} />
          ) : (
            <GroomerSetup key={profile.id} profile={profile} embedded bookingsCount={bookings.length} onComplete={async (p) => {
              const toSave = { ...p, radiusKm: Number(p.radiusKm) || 10 };
              const ok = await saveGroomerProfile(toSave);
              if (ok) {
                setProfile(toSave);
                setTab("dashboard");
                setTimeout(() => alert("저장되었습니다."), 100);
              } else {
                alert("저장에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.");
              }
            }} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function GroomerDashboard({ profile, bookings, onRefresh }: { profile: GroomerProfile; bookings: Booking[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<"all" | "paid" | "confirmed" | "completed">("all");
  const [notifyLoading, setNotifyLoading] = useState<string | null>(null);
  const [confirmingBooking, setConfirmingBooking] = useState<Booking | null>(null);
  const [confirmTime, setConfirmTime] = useState("");
  const filtered = bookings.filter((b) => {
    if (filter === "all") return b.status !== "cancelled";
    if (filter === "paid") return b.status === "paid";
    if (filter === "confirmed") return b.status === "confirmed";
    if (filter === "completed") return b.status === "completed";
    return true;
  });

  const unsettled = bookings.filter((b) => b.status === "completed" && (b.settlementStatus ?? "unsettled") === "unsettled");
  const settled = bookings.filter((b) => b.settlementStatus === "settled");
  const reviews = bookings.filter((b) => b.status === "completed" && b.reviewRating != null);
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, b) => s + (b.reviewRating ?? 0), 0) / reviews.length).toFixed(1) : null;
  const customerCounts = bookings
    .filter((b) => b.status !== "cancelled" && (b.status === "completed" || b.status === "confirmed" || b.status === "paid"))
    .reduce<Record<string, number>>((acc, b) => {
      const phone = (b.customerPhone ?? "").trim();
      const name = (b.customerName ?? "").trim();
      const key = phone || (name || "연락처 미정");
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

  const openConfirmModal = (b: Booking) => {
    const defaultTime = TIME_SLOTS.includes(b.time) ? b.time : TIME_SLOTS.find((t) => t >= b.time) ?? TIME_SLOTS[0];
    setConfirmingBooking(b);
    setConfirmTime(defaultTime);
  };
  const handleConfirm = async () => {
    if (!confirmingBooking) return;
    await updateBooking(confirmingBooking.id, {
      status: "confirmed",
      confirmedAt: new Date().toISOString(),
      time: confirmTime,
    });
    setConfirmingBooking(null);
    onRefresh();
  };
  const handleNotify = async (b: Booking) => {
    const phone = (b.customerPhone ?? "").replace(/\D/g, "");
    if (!phone || phone.length < 10) {
      alert("고객 연락처가 없거나 올바르지 않아 SMS를 보낼 수 없습니다.");
      return;
    }
    setNotifyLoading(b.id);
    const body = `[미미살롱펫] ${b.date} ${b.time} ${b.serviceName} 예약이 확정되었습니다. ${profile.name} 디자이너가 방문 예정입니다.${profile.phone ? ` 문의: ${profile.phone}` : ""}`;
    try {
      const res = await fetch("/api/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: b.customerPhone, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "SMS 발송 실패");
      await updateBooking(b.id, { customerNotifiedAt: new Date().toISOString() });
      onRefresh();
      alert("고객에게 예약확정 문자가 발송되었습니다.");
    } catch (e) {
      alert(`문자 발송 실패: ${e instanceof Error ? e.message : String(e)}\n\n실제 SMS 발송을 위해 알리고, NHN Cloud 등 API 연동이 필요합니다.`);
    } finally {
      setNotifyLoading(null);
    }
  };
  const handleComplete = async (b: Booking) => {
    await updateBooking(b.id, { status: "completed", settlementStatus: "unsettled" });
    onRefresh();
  };
  const handleSettlementRequest = async (b: Booking) => {
    await updateBooking(b.id, { settlementRequestedAt: new Date().toISOString() });
    onRefresh();
  };

  return (
    <>
      <div className="card p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-bold text-gray-800 mb-2">{profile.name}</h2>
            {avgRating != null && (
              <p className="text-sm text-amber-600 mb-1">⭐ {avgRating} · 이용후기 {reviews.length}건</p>
            )}
          </div>
        </div>
        {(profile.phone || profile.email) && (
          <p className="text-sm text-gray-600 mb-1">
            {profile.phone && <span>{profile.phone}</span>}
            {profile.phone && profile.email && " · "}
            {profile.email && <span>{profile.email}</span>}
          </p>
        )}
        {profile.intro && <p className="text-sm text-gray-600 mb-1">{profile.intro}</p>}
        {profile.career && <p className="text-xs text-gray-500">{profile.career}</p>}
        <p className="text-sm text-gray-600 mt-2">{profile.address} · 반경 {profile.radiusKm}km · 전체 미용 서비스</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card p-5">
          <p className="text-sm text-gray-500">미정산</p>
          <p className="text-xl font-bold text-mimi-orange mt-1">{unsettled.length}건 · {unsettled.reduce((s, b) => s + (b.price ?? 0), 0).toLocaleString()}원</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">정산완료</p>
          <p className="text-xl font-bold text-green-600 mt-1">{settled.length}건 · {settled.reduce((s, b) => s + (b.price ?? 0), 0).toLocaleString()}원</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">고객 수</p>
          <p className="text-xl font-bold text-gray-800 mt-1">{Object.keys(customerCounts).length}명</p>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">고객별 이용 횟수</h2>
        <div className="card p-5 bg-mimi-cream">
              {Object.keys(customerCounts).length === 0 ? (
            <p className="text-sm text-gray-500">데이터가 없습니다</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(customerCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([k, v]) => (
                  <span key={k} className="px-3 py-1 bg-white rounded-full text-sm border">
                    {k} <strong>{v}회</strong>
                  </span>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "paid", "confirmed", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`tab-btn ${filter === f ? "tab-btn-active" : "tab-btn-inactive"}`}
          >
            {f === "all" ? "전체" : f === "paid" ? "결제완료" : f === "confirmed" ? "예약확정" : "서비스완료"}
          </button>
        ))}
      </div>

      <h2 className="text-lg font-bold text-gray-800 mb-4">예약 목록</h2>
      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-gray-600 bg-mimi-cream">예약이 없습니다</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((b) => (
            <div key={b.id} className="card p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold">{b.serviceName}</p>
                  <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                    <p>
                      <span className="text-gray-500 font-medium">
                        {b.status === "paid" ? "예약희망시간" : "확정일시"}
                      </span>{" "}
                      {b.date} {b.time}
                    </p>
                    <p>
                      <span className="text-gray-500 font-medium">결재한 시간</span> {formatDateTime(b.createdAt)}
                    </p>
                  </div>
                  {b.status === "paid" && (() => {
                    const elapsed = getElapsedSincePayment(b.createdAt);
                    return elapsed ? (
                      <p className={`text-xs font-medium mt-2 px-2 py-1 rounded inline-block ${
                        elapsed.minutes >= 30 ? "text-amber-700 bg-amber-50" : "text-gray-600 bg-gray-50"
                      }`}>
                        🔔 {elapsed.label}{elapsed.minutes >= 30 ? " 경과 · 예약확정 필요" : ""}
                      </p>
                    ) : null;
                  })()}
                  <p className="text-sm mt-1">{formatBookingPets(b)} · {b.address}</p>
                  <p className="text-sm">{b.customerName && `${b.customerName} · `}{b.customerPhone}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {b.customerNotifiedAt && (
                      <span className="text-xs text-green-600">✓ 고객 통보 완료</span>
                    )}
                    {b.photoConsentAgreed && (
                      <span className="text-xs text-purple-600">📷 사진촬영 동의</span>
                    )}
                    {b.settlementStatus === "settled" && (
                      <span className="text-xs text-blue-600">정산완료</span>
                    )}
                    {b.settlementRequestedAt && (b.settlementStatus ?? "unsettled") === "unsettled" && (
                      <span className="text-xs text-amber-600">정산요청됨</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-mimi-orange">{b.price?.toLocaleString()}원</p>
                  <span className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${
                    b.status === "paid" ? "bg-green-100 text-green-800" : b.status === "confirmed" ? "bg-blue-100 text-blue-800" : b.status === "completed" ? "bg-gray-100 text-gray-700" : "bg-gray-100 text-gray-700"
                  }`}>
                    {getStatusLabel(b.status)}
                  </span>
                </div>
              </div>
              {((b.status === "completed") || (b.status === "confirmed" && b.photoConsentAgreed)) && (
                <BookingPhotoUpload booking={b} onUpdate={onRefresh} />
              )}
              {b.status === "completed" && b.reviewRating != null && (
                <div className="mt-4 pt-4 border-t border-stone-200">
                  <h4 className="font-medium text-gray-800 mb-1">⭐ 이용후기</h4>
                  <StarRating value={b.reviewRating} readonly size="sm" />
                  {b.reviewText && <p className="text-sm text-gray-600 mt-1">{b.reviewText}</p>}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                {b.status === "paid" && (
                  <button onClick={() => openConfirmModal(b)} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700">
                    예약확정
                  </button>
                )}
                {(b.status === "confirmed" || b.status === "paid") && !b.customerNotifiedAt && (
                  <button onClick={() => handleNotify(b)} disabled={!!notifyLoading} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60">
                    {notifyLoading === b.id ? "발송 중..." : "고객에게 확인 통보"}
                  </button>
                )}
                {b.status === "confirmed" && (
                  <button onClick={() => handleComplete(b)} className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700">
                    서비스완료
                  </button>
                )}
                {b.status === "completed" && (b.settlementStatus ?? "unsettled") === "unsettled" && (
                  <button
                    onClick={() => handleSettlementRequest(b)}
                    disabled={!!b.settlementRequestedAt}
                    className="px-3 py-1.5 bg-mimi-orange text-white text-sm rounded-lg hover:bg-mimi-orange/90 disabled:opacity-60 disabled:cursor-default"
                  >
                    {b.settlementRequestedAt ? "정산요청 완료" : "정산요청"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmingBooking(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-2">예약확정 – 확정 시간 선택</h3>
            <p className="text-sm text-gray-600 mb-4">
              고객 희망: {confirmingBooking.date} {confirmingBooking.time}
            </p>
            <p className="text-sm font-medium text-gray-700 mb-2">30분 단위로 확정 시간을 선택하세요</p>
            <div className="grid grid-cols-4 gap-2 mb-6 max-h-48 overflow-y-auto">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setConfirmTime(t)}
                  className={`py-2 rounded-lg text-sm font-medium ${confirmTime === t ? "bg-mimi-orange text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmingBooking(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium">
                취소
              </button>
              <button onClick={handleConfirm} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700">
                {confirmTime}로 확정
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function GroomerSetup({
  profile,
  embedded,
  onComplete,
  bookingsCount,
}: {
  profile?: GroomerProfile | null;
  embedded?: boolean;
  onComplete: (p: GroomerProfile) => void;
  bookingsCount?: number;
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [birthDate, setBirthDate] = useState(profile?.birthDate ?? (profile?.age ? getBirthDateFromAge(profile.age) : ""));
  const [gender, setGender] = useState<"male" | "female" | "">(() => {
    const g = profile?.gender;
    return g === "male" || g === "female" ? g : "";
  });
  const [intro, setIntro] = useState(profile?.intro ?? "");
  const [career, setCareer] = useState(profile?.career ?? "");
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl ?? "");
  const [address, setAddress] = useState(profile?.address ?? profile?.area ?? "");
  const [radiusKm, setRadiusKm] = useState<number>(() => {
    const v = Number(profile?.radiusKm) || 10;
    return [3, 5, 10, 15, 20, 30].includes(v) ? v : 10;
  });
  const [slots, setSlots] = useState<AvailableSlot[]>(profile?.availableSlots ?? []);
  const [bankName, setBankName] = useState(profile?.bankName ?? "");
  const [accountNumber, setAccountNumber] = useState(profile?.accountNumber ?? "");
  const [accountHolder, setAccountHolder] = useState(profile?.accountHolder ?? "");
  const [step, setStep] = useState<"info" | "slots">(profile ? "slots" : "info");
  const [profileEditTab, setProfileEditTab] = useState<"basic" | "slots">("basic");

  const latestRef = useRef({ name, phone, email, birthDate, gender, intro, career, photoUrl, address, radiusKm, slots, bankName, accountNumber, accountHolder });
  latestRef.current = { name, phone, email, birthDate, gender, intro, career, photoUrl, address, radiusKm, slots, bankName, accountNumber, accountHolder };

  const addSlot = (date: string, times: string[]) => {
    if (!date || times.length === 0) return;
    setSlots((prev) => {
      const rest = prev.filter((s) => s.date !== date);
      return [...rest, { date, times }].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const removeSlot = (date: string) => {
    setSlots((prev) => prev.filter((s) => s.date !== date));
  };

  const handleSubmit = async () => {
    const { name: n, phone: ph, email: em, birthDate: bd, gender: gen, intro: inr, career: car, photoUrl: phUrl, address: a, radiusKm: r, slots: sl, bankName: bn, accountNumber: an, accountHolder: ah } = latestRef.current;
    const services = buildAllServiceItemsForGroomer();
    if (!n.trim() || !a.trim()) return;
    const id = profile?.id ?? `G${Date.now()}`;
    const addr = a.trim();
    const areaParts = addr.split(/\s+/).slice(0, 2).join(" ");
    const radius = Number(r) || 10;
    const age = bd ? getAgeFromBirthDate(bd) : undefined;
    onComplete({
      id,
      name: n.trim(),
      phone: (ph ?? "").trim() || undefined,
      email: (em ?? "").trim() || undefined,
      age,
      birthDate: (bd ?? "").trim() || undefined,
      gender: gen || undefined,
      intro: (inr ?? "").trim() || undefined,
      career: (car ?? "").trim() || undefined,
      photoUrl: (phUrl ?? "").trim() || undefined,
      address: addr,
      radiusKm: radius,
      area: areaParts,
      services,
      availableSlots: sl,
      createdAt: profile?.createdAt ?? new Date().toISOString(),
      passwordHash: profile?.passwordHash,
      suspended: profile?.suspended,
      bankName: (bn ?? "").trim() || undefined,
      accountNumber: (an ?? "").trim() || undefined,
      accountHolder: (ah ?? "").trim() || undefined,
    });
  };

  const content = (
    <div className={embedded ? "w-full min-w-0" : "min-h-screen flex flex-col"}>
      {!embedded && <Header />}
      {/* embedded: 대시보드 main에 이미 p-6 있음 → 이중 패딩 제거·가로 넘침 방지 */}
      <main className={embedded ? "flex-1 w-full min-w-0 px-0 py-1 sm:py-2" : "flex-1 p-6"}>
        <div className={embedded ? "w-full min-w-0 max-w-full mx-auto" : "max-w-lg mx-auto"}>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            {profile ? "프로필 수정" : "디자이너 등록"}
          </h1>

          {step === "info" && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-800 mb-2">인적사항 (이름, 연락처, 생년월일, 성별 등)</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">만 18세 이상</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "male" | "female" | "")}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
                  >
                    <option value="">선택</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">소개글</label>
                <textarea
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  placeholder="반려동물 미용에 대한 소개를 작성해 주세요"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">경력</label>
                <textarea
                  value={career}
                  onChange={(e) => setCareer(e.target.value)}
                  placeholder="예: 5년차 반려동물 디자이너, OO미용학원 수료"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none resize-none"
                />
              </div>
              <GroomerProfilePhotoInput value={photoUrl} onChange={setPhotoUrl} className="min-w-0 max-w-full" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">자기 주소지</label>
                <AddressSearchInput
                  value={address}
                  onChange={setAddress}
                  placeholder="주소 검색 버튼을 클릭하여 입력"
                />
                <p className="text-xs text-gray-500 mt-1">주소 검색으로 자동 입력하거나 직접 입력해 주세요</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">방문 가능 반경 (km)</label>
                <select
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
                >
                  <option value={3}>3km</option>
                  <option value={5}>5km</option>
                  <option value={10}>10km</option>
                  <option value={15}>15km</option>
                  <option value={20}>20km</option>
                  <option value={30}>30km</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">주소지 기준 이 거리 내로 방문합니다</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-medium text-gray-800 mb-2">정산용 계좌 정보 (선택)</h4>
                <p className="text-xs text-gray-500 mb-2">나중에 프로필에서 추가 가능합니다</p>
                <div className="grid grid-cols-3 gap-2">
                  <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="은행" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                  <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="계좌번호" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                  <input type="text" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="예금주" className="px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                </div>
              </div>
              <button
                onClick={() => setStep("slots")}
                disabled={!name.trim() || !address.trim()}
                className="w-full py-3 bg-mimi-orange text-white rounded-xl font-bold disabled:opacity-50"
              >
                다음 (가능 시간 설정)
              </button>
            </div>
          )}

          {step === "slots" && (
            <div className="space-y-6">
              {profile && (
                <>
                  <div className="flex gap-2 border-b border-gray-200 pb-2">
                    <button
                      type="button"
                      onClick={() => setProfileEditTab("basic")}
                      className={`px-4 py-2 rounded-lg font-medium ${profileEditTab === "basic" ? "bg-mimi-orange text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      기본정보
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileEditTab("slots")}
                      className={`px-4 py-2 rounded-lg font-medium ${profileEditTab === "slots" ? "bg-mimi-orange text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      가능시간 ({slots.length}일{bookingsCount !== undefined ? ` · ${bookingsCount}건` : ""})
                    </button>
                  </div>
                  {profileEditTab === "basic" && (
                    <div className="p-3 sm:p-4 bg-mimi-cream rounded-xl space-y-4 w-full min-w-0 max-w-full overflow-x-clip">
                      <h3 className="text-base font-bold text-gray-800 pb-2 border-b border-gray-200">기본 정보 수정</h3>
                      <GroomerProfilePhotoInput value={photoUrl} onChange={setPhotoUrl} className="w-full min-w-0" />
                      <div className="w-full min-w-0">
                        <label className="block text-sm font-medium text-gray-700 mb-2">자기 주소지</label>
                        <AddressSearchInput
                          value={address}
                          onChange={setAddress}
                          placeholder="검색 후 입력 또는 직접 입력"
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">주소 검색으로 자동 입력하거나 직접 입력해 주세요</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">생년월일</label>
                          <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
                          />
                          {birthDate && getAgeFromBirthDate(birthDate) !== undefined && (
                            <p className="text-xs text-gray-500 mt-1">만 {getAgeFromBirthDate(birthDate)}세</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">성별</label>
                          <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value as "male" | "female" | "")}
                            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
                          >
                            <option value="">선택</option>
                            <option value="male">남성</option>
                            <option value="female">여성</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">방문 가능 반경 (km)</label>
                        <select
                          value={radiusKm}
                          onChange={(e) => setRadiusKm(Number(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
                        >
                          <option value={3}>3km</option>
                          <option value={5}>5km</option>
                          <option value={10}>10km</option>
                          <option value={15}>15km</option>
                          <option value={20}>20km</option>
                          <option value={30}>30km</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">주소지 기준 이 거리 내로 방문합니다</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <h4 className="text-sm font-medium text-gray-800 mb-2">정산용 계좌 정보</h4>
                        <p className="text-xs text-gray-500 mb-2">관리자가 정산 시 입금할 계좌입니다</p>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs text-gray-600">은행명</label>
                            <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="예: 국민은행" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">계좌번호</label>
                            <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="예: 123-456-789012" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600">예금주</label>
                            <input type="text" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="예: 홍길동" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">비밀번호는 관리자 설정에서 부여받습니다.</p>
                      <button
                        type="button"
                        onClick={() => handleSubmit()}
                        className="w-full py-3 bg-mimi-orange text-white rounded-xl font-bold hover:bg-mimi-orange/90"
                      >
                        저장 확인
                      </button>
                    </div>
                  )}
                  {profileEditTab === "slots" && (
                    <SlotEditor
                      slots={slots}
                      onAdd={addSlot}
                      onRemove={removeSlot}
                      onPrev={() => setProfileEditTab("basic")}
                      onSubmit={() => handleSubmit()}
                      requireSlots={false}
                      submitLabel="저장 확인"
                    />
                  )}
                </>
              )}
              {!profile && (
                <SlotEditor
                  slots={slots}
                  onAdd={addSlot}
                  onRemove={removeSlot}
                  onPrev={() => setStep("info")}
                  onSubmit={() => handleSubmit()}
                  requireSlots={true}
                  submitLabel="등록 완료"
                />
              )}
            </div>
          )}

        </div>
      </main>
      {!embedded && <Footer />}
    </div>
  );

  return content;
}

function SlotEditor({
  slots,
  onAdd,
  onRemove,
  onPrev,
  onSubmit,
  requireSlots,
  submitLabel = "저장",
}: {
  slots: AvailableSlot[];
  onAdd: (date: string, times: string[]) => void;
  onRemove: (date: string) => void;
  onPrev: () => void;
  onSubmit: () => void;
  requireSlots?: boolean;
  submitLabel?: string;
}) {
  const [selDate, setSelDate] = useState("");
  const [selDateTo, setSelDateTo] = useState("");
  const [selTimes, setSelTimes] = useState<string[]>([]);
  const [useRange, setUseRange] = useState(false);
  const days = getNextDays(30);

  const toggleTime = (t: string) => {
    setSelTimes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].sort()));
  };

  const addSlot = (date: string, times: string[]) => {
    if (!date || times.length === 0) return;
    onAdd(date, times);
  };

  const handleAdd = () => {
    if (selTimes.length === 0) return;
    if (useRange && selDate && selDateTo) {
      const from = new Date(selDate);
      const to = new Date(selDateTo);
      if (from > to) return;
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        addSlot(d.toISOString().slice(0, 10), selTimes);
      }
      setSelDate("");
      setSelDateTo("");
      setSelTimes([]);
    } else if (selDate) {
      addSlot(selDate, selTimes);
      setSelDate("");
      setSelTimes([]);
    }
  };

  const canAdd = selTimes.length > 0 && (useRange ? selDate && selDateTo : selDate);

  return (
    <div className="space-y-6">
      <p className="text-gray-600">가능한 날짜와 시간을 설정하세요 (날짜 범위로 한 번에 추가 가능)</p>

      <div className="flex gap-2">
        <button
          onClick={() => setUseRange(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${!useRange ? "bg-mimi-orange text-white" : "bg-gray-100"}`}
        >
          단일 날짜
        </button>
        <button
          onClick={() => setUseRange(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${useRange ? "bg-mimi-orange text-white" : "bg-gray-100"}`}
        >
          날짜 범위 (중복 설정)
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {useRange ? "시작일 ~ 종료일" : "날짜 선택"}
        </label>
        {useRange ? (
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={selDate}
              onChange={(e) => setSelDate(e.target.value)}
              min={days[0]?.toISOString().slice(0, 10)}
              max={days[days.length - 1]?.toISOString().slice(0, 10)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
            />
            <span>~</span>
            <input
              type="date"
              value={selDateTo}
              onChange={(e) => setSelDateTo(e.target.value)}
              min={selDate || days[0]?.toISOString().slice(0, 10)}
              max={days[days.length - 1]?.toISOString().slice(0, 10)}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none"
            />
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
            {days.map((d) => {
              const dateStr = d.toISOString().slice(0, 10);
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelDate(dateStr)}
                  type="button"
                  className={`p-2 rounded-lg border-2 text-sm ${selDate === dateStr ? "border-mimi-orange bg-mimi-orange/5" : "border-gray-200"}`}
                >
                  {d.getMonth() + 1}/{d.getDate()}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">시간 선택 (공통 적용)</label>
        <div className="grid grid-cols-3 gap-2">
          {TIME_SLOTS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTime(t)}
              className={`p-2 rounded-lg text-sm ${selTimes.includes(t) ? "bg-mimi-orange text-white" : "bg-gray-100"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={handleAdd} disabled={!canAdd} className="mt-3 py-2 px-4 bg-mimi-blue text-white rounded-lg text-sm disabled:opacity-50">
          {useRange ? "범위 적용" : "추가"}
        </button>
      </div>

      {slots.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">등록된 가능 시간</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {slots.map((s) => (
              <div key={s.date} className="flex justify-between items-center p-3 bg-mimi-cream rounded-lg">
                <span>{s.date} · {s.times.join(", ")}</span>
                <button type="button" onClick={() => onRemove(s.date)} className="text-red-500 text-sm">삭제</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <button type="button" onClick={onPrev} className="text-gray-500 text-sm">← 이전</button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={requireSlots && slots.length === 0}
          className="flex-1 py-3 bg-mimi-orange text-white rounded-xl font-bold disabled:opacity-50"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
