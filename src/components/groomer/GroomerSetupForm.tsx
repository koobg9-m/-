"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { saveGroomerProfile } from "@/lib/groomer-storage";
import type { GroomerProfile, AvailableSlot } from "@/lib/groomer-types";
import { TIME_SLOTS } from "@/lib/services";
import AddressSearchInput from "@/components/common/AddressSearchInput";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

function getAgeFromBirthDate(birthDate: string): number | undefined {
  if (!birthDate) return undefined;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 18 ? age : undefined;
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

const MY_GROOMER_KEY = "mimi_my_groomer_id";

/** 디자이너 신청 전용 - 새 등록 폼 */
export default function GroomerSetupForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [intro, setIntro] = useState("");
  const [career, setCareer] = useState("");
  const [address, setAddress] = useState("");
  const [radiusKm, setRadiusKm] = useState(10);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [step, setStep] = useState<"info" | "slots">("info");

  const latestRef = useRef({ name, phone, email, birthDate, gender, intro, career, address, radiusKm, slots, bankName, accountNumber, accountHolder });
  latestRef.current = { name, phone, email, birthDate, gender, intro, career, address, radiusKm, slots, bankName, accountNumber, accountHolder };

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
    const { name: n, phone: ph, email: em, birthDate: bd, gender: gen, intro: inr, career: car, address: a, radiusKm: r, slots: sl, bankName: bn, accountNumber: an, accountHolder: ah } = latestRef.current;
    if (!n.trim() || !a.trim()) return;
    const id = `G${Date.now()}`;
    const addr = a.trim();
    const areaParts = addr.split(/\s+/).slice(0, 2).join(" ");
    const radius = Number(r) || 10;
    const age = bd ? getAgeFromBirthDate(bd) : undefined;
    const profile: GroomerProfile = {
      id,
      name: n.trim(),
      phone: (ph ?? "").trim() || undefined,
      email: (em ?? "").trim() || undefined,
      age,
      birthDate: (bd ?? "").trim() || undefined,
      gender: gen || undefined,
      intro: (inr ?? "").trim() || undefined,
      career: (car ?? "").trim() || undefined,
      address: addr,
      radiusKm: radius,
      area: areaParts,
      services: [],
      availableSlots: sl,
      createdAt: new Date().toISOString(),
      bankName: (bn ?? "").trim() || undefined,
      accountNumber: (an ?? "").trim() || undefined,
      accountHolder: (ah ?? "").trim() || undefined,
    };
    await saveGroomerProfile(profile);
    localStorage.setItem(MY_GROOMER_KEY, id);
    alert("신청이 완료되었습니다. 관리자가 비밀번호를 부여하면 서비스 개시됩니다.");
    window.location.href = "/groomer";
  };

  const [selDate, setSelDate] = useState("");
  const [selDateTo, setSelDateTo] = useState("");
  const [selTimes, setSelTimes] = useState<string[]>([]);
  const [useRange, setUseRange] = useState(false);
  const days = getNextDays(30);

  const toggleTime = (t: string) => {
    setSelTimes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t].sort()));
  };

  const handleAddSlot = () => {
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">디자이너 신청</h1>
          <p className="text-sm text-gray-600 mb-6">내용 작성 후 신청하기를 누르시면, 관리자가 비밀번호를 부여한 후 서비스 개시됩니다.</p>

          {step === "info" && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-800 mb-2">인적사항 (이름, 연락처, 생년월일, 성별 등)</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().slice(0, 10)} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none" />
                  <p className="text-xs text-gray-500 mt-1">만 18세 이상</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value as "male" | "female" | "")} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none">
                    <option value="">선택</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">소개글</label>
                <textarea value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="반려동물 미용에 대한 소개를 작성해 주세요" rows={3} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">경력</label>
                <textarea value={career} onChange={(e) => setCareer(e.target.value)} placeholder="예: 5년차 반려동물 디자이너, OO미용학원 수료" rows={2} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">자기 주소지</label>
                <AddressSearchInput value={address} onChange={setAddress} placeholder="주소 검색 버튼을 클릭하여 입력" />
                <p className="text-xs text-gray-500 mt-1">주소 검색으로 자동 입력하거나 직접 입력해 주세요</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">방문 가능 반경 (km)</label>
                <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none">
                  {[3, 5, 10, 15, 20, 30].map((v) => (
                    <option key={v} value={v}>{v}km</option>
                  ))}
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
              <button onClick={() => setStep("slots")} disabled={!name.trim() || !address.trim()} className="w-full py-3 bg-mimi-orange text-white rounded-xl font-bold disabled:opacity-50">
                다음
              </button>
            </div>
          )}

          {step === "slots" && (
            <div className="space-y-6">
              <p className="text-gray-600">가능한 날짜와 시간을 설정하세요 (날짜 범위로 한 번에 추가 가능)</p>
              <div className="flex gap-2">
                <button onClick={() => setUseRange(false)} className={`px-4 py-2 rounded-lg text-sm font-medium ${!useRange ? "bg-mimi-orange text-white" : "bg-gray-100"}`}>단일 날짜</button>
                <button onClick={() => setUseRange(true)} className={`px-4 py-2 rounded-lg text-sm font-medium ${useRange ? "bg-mimi-orange text-white" : "bg-gray-100"}`}>날짜 범위</button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{useRange ? "시작일 ~ 종료일" : "날짜 선택"}</label>
                {useRange ? (
                  <div className="flex gap-2 items-center">
                    <input type="date" value={selDate} onChange={(e) => setSelDate(e.target.value)} min={days[0]?.toISOString().slice(0, 10)} max={days[days.length - 1]?.toISOString().slice(0, 10)} className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200" />
                    <span>~</span>
                    <input type="date" value={selDateTo} onChange={(e) => setSelDateTo(e.target.value)} min={selDate || days[0]?.toISOString().slice(0, 10)} max={days[days.length - 1]?.toISOString().slice(0, 10)} className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200" />
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                    {days.map((d) => {
                      const dateStr = d.toISOString().slice(0, 10);
                      return (
                        <button key={dateStr} onClick={() => setSelDate(dateStr)} type="button" className={`p-2 rounded-lg border-2 text-sm ${selDate === dateStr ? "border-mimi-orange bg-mimi-orange/5" : "border-gray-200"}`}>
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
                    <button key={t} type="button" onClick={() => toggleTime(t)} className={`p-2 rounded-lg text-sm ${selTimes.includes(t) ? "bg-mimi-orange text-white" : "bg-gray-100"}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <button onClick={handleAddSlot} disabled={!canAdd} className="mt-3 py-2 px-4 bg-mimi-blue text-white rounded-lg text-sm disabled:opacity-50">
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
                        <button type="button" onClick={() => removeSlot(s.date)} className="text-red-500 text-sm">삭제</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setStep("info")} className="text-gray-500 text-sm">← 이전</button>
                <button type="button" onClick={handleSubmit} disabled={slots.length === 0} className="flex-1 py-3 bg-mimi-orange text-white rounded-xl font-bold disabled:opacity-50">
                  신청하기
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
