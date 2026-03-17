"use client";

import { useState } from "react";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const DEMO_MODE =
  process.env.NEXT_PUBLIC_DEMO_AUTH === "true" ||
  !supabaseUrl ||
  !supabaseUrl.startsWith("http");

function formatPhoneForDisplay(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return `+82${digits.slice(1)}`;
  if (digits.startsWith("82")) return `+${digits}`;
  return `+82${digits}`;
}

export default function PhoneAuthForm() {
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("올바른 휴대폰 번호를 입력해 주세요.");
      return;
    }
    setLoading(true);

    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 800));
      setStep("otp");
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOtp({
        phone: toE164(phone),
        options: { channel: "sms" },
      });
      if (err) throw err;
      setStep("otp");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "인증번호 발송에 실패했습니다.";
      setError(msg);
      if (msg.includes("Phone") || msg.includes("provider") || msg.includes("enabled")) {
        setError("휴대폰 인증이 아직 설정되지 않았습니다. Vercel에 NEXT_PUBLIC_DEMO_AUTH=true 를 추가해 데모 모드로 사용하세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("6자리 인증번호를 입력해 주세요.");
      return;
    }
    setLoading(true);

    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 600));
      if (typeof window !== "undefined") {
        localStorage.setItem("mimi_demo_user", JSON.stringify({ phone: formatPhoneForDisplay(phone), demo: true }));
        const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
        window.location.href = redirect;
      }
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: err } = await supabase.auth.verifyOtp({
        phone: toE164(phone),
        token: otp,
        type: "sms",
      });
      if (err) throw err;
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
      window.location.href = redirect;
    } catch (err) {
      setError(err instanceof Error ? err.message : "인증번호가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  const displayPhone = formatPhoneForDisplay(phone);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-mimi-yellow/50 p-8">
        <div className="text-center mb-6">
          <span className="text-4xl">📱</span>
          <h1 className="text-xl font-bold text-gray-800 mt-2">휴대폰 번호로 로그인</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === "phone" ? "휴대폰 번호를 입력하면 SMS 인증번호가 발송됩니다" : `${displayPhone}로 발송된 6자리 인증번호를 입력하세요`}
          </p>
        </div>

        {DEMO_MODE && (
          <div className="mb-4 p-3 bg-mimi-yellow/30 rounded-lg text-center text-sm text-amber-800">
            데모 모드 · 인증번호 아무거나 6자리 입력
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">휴대폰 번호</label>
            <input
              type="tel"
              value={displayPhone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="010-1234-5678"
              inputMode="numeric"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange focus:ring-2 focus:ring-mimi-orange/20 outline-none transition-all text-lg"
              maxLength={13}
              autoFocus
              aria-label="휴대폰 번호"
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-mimi-orange text-white font-bold rounded-xl hover:bg-mimi-orange/90 disabled:opacity-60 transition-colors"
            >
              {loading ? "발송 중..." : "인증번호 받기"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange focus:ring-2 focus:ring-mimi-orange/20 outline-none transition-all text-lg text-center tracking-[0.5em]"
              maxLength={6}
              autoFocus
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-mimi-orange text-white font-bold rounded-xl hover:bg-mimi-orange/90 disabled:opacity-60 transition-colors"
            >
              {loading ? "확인 중..." : "로그인"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
              className="w-full py-2 text-gray-500 text-sm hover:text-mimi-orange transition-colors"
            >
              번호 변경
            </button>
          </form>
        )}
      </div>

      <p className="text-center mt-6 text-sm text-gray-500">
        <Link href="/" className="text-mimi-orange hover:underline">홈으로 돌아가기</Link>
      </p>
    </div>
  );
}
