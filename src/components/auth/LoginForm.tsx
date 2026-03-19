"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SKIP_CUSTOMER_AUTH = process.env.NEXT_PUBLIC_SKIP_CUSTOMER_AUTH === "true";
const DEMO_MODE =
  !SKIP_CUSTOMER_AUTH &&
  (process.env.NEXT_PUBLIC_DEMO_AUTH === "true" ||
    process.env.NEXT_PUBLIC_SKIP_SUPABASE === "1" ||
    !supabaseUrl ||
    !supabaseUrl.startsWith("http"));

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

function toE164(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) return `+82${d.slice(1)}`;
  if (d.startsWith("82")) return `+${d}`;
  return `+82${d}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isRateLimitError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return lower.includes("rate limit") || lower.includes("429") || lower.includes("too many");
}

function formatAuthError(msg: string, method: LoginMethod): string {
  if (isRateLimitError(msg)) {
    if (method === "email") {
      return "이메일 발송 한도를 초과했어요. 1시간 후에 다시 시도하거나, 휴대폰 번호로 로그인해 주세요.";
    }
    return "인증번호 발송 한도를 초과했어요. 잠시 후에 다시 시도해 주세요.";
  }
  return msg;
}

type LoginMethod = "phone" | "email";

export default function LoginForm() {
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (SKIP_CUSTOMER_AUTH && typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || "/";
      window.location.replace(redirect);
    }
  }, []);

  if (SKIP_CUSTOMER_AUTH) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-gray-600">이동 중...</p>
      </div>
    );
  }
  const [method, setMethod] = useState<LoginMethod>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"input" | "otp" | "email_sent">("input");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rateLimitHit, setRateLimitHit] = useState(false);

  const handlePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRateLimitHit(false);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("올바른 휴대폰 번호를 입력해 주세요. (10~11자리)");
      return;
    }
    setLoading(true);
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 600));
      setStep("otp");
    } else {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const { error: err } = await createClient().auth.signInWithOtp({
          phone: toE164(phone),
          options: { channel: "sms" },
        });
        if (err) throw err;
        setStep("otp");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "발송 실패";
        setRateLimitHit(isRateLimitError(msg));
        setError(formatAuthError(msg, "phone"));
      }
    }
    setLoading(false);
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.length !== 6) {
      setError("6자리 인증번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    if (DEMO_MODE) {
      await new Promise((r) => setTimeout(r, 500));
      if (typeof window !== "undefined") {
        const phoneFormatted = formatPhone(phone);
        localStorage.setItem("mimi_demo_user", JSON.stringify({ phone: phoneFormatted, demo: true }));
        const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
        window.location.replace(redirect);
      }
      return;
    } else {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const { error: err } = await createClient().auth.verifyOtp({
          phone: toE164(phone),
          token: otp,
          type: "sms",
        });
        if (err) throw err;
        const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
        window.location.href = redirect;
      } catch (err) {
        setError(err instanceof Error ? err.message : "인증 실패");
      }
    }
    setLoading(false);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setRateLimitHit(false);
    if (!isValidEmail(email)) {
      setError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    setLoading(true);
    if (DEMO_MODE || !isSupabaseConfigured()) {
      await new Promise((r) => setTimeout(r, 600));
      setStep("email_sent");
    } else {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const redirectTo = typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;
        const { error: err } = await createClient().auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: redirectTo,
            shouldCreateUser: true,
          },
        });
        if (err) throw err;
        setStep("email_sent");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "발송 실패";
        setRateLimitHit(isRateLimitError(msg));
        setError(formatAuthError(msg, "email"));
      }
    }
    setLoading(false);
  };

  const handleDemoEmailLogin = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mimi_demo_user", JSON.stringify({ email: email.trim(), demo: true }));
      const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
      window.location.replace(redirect);
    }
  };

  const resetStep = () => {
    setStep("input");
    setOtp("");
    setError("");
  };

  const handleKakaoLogin = async () => {
    if (DEMO_MODE || !isSupabaseConfigured()) {
      setError("카카오 로그인을 사용할 수 없습니다. (설정 확인 필요)");
      return;
    }
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const redirectTo = typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : undefined;
      const { error: err } = await createClient().auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo },
      });
      if (err) throw err;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "카카오 로그인 실패";
      if (msg.includes("provider is not enabled") || msg.includes("Unsupported provider")) {
        setError(
          "Supabase에서 Kakao Enable 필요. 아래 링크에서 Kakao → Enable ON → Client ID·Secret 입력 → Save"
        );
      } else {
        setError(msg);
      }
    }
  };

  return (
    <>
      <Link href="/" className="absolute top-6 left-6 flex items-center transition-opacity hover:opacity-85">
        {logoError ? (
          <span className="font-malang-bold text-lg text-mimi-primary">미미살롱펫</span>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src="/logo.png" alt="미미살롱펫" width={140} height={48} className="h-10 md:h-12 w-auto object-contain" onError={() => setLogoError(true)} />
        )}
      </Link>

      <div className="w-full max-w-sm card p-8 shadow-elevated border-stone-200">
        <div className="text-center mb-6">
          <span className="text-4xl">{method === "email" ? "✉️" : "📱"}</span>
          <h1 className="text-xl font-bold text-gray-800 mt-2">
            {method === "email" ? "이메일로 로그인" : "휴대폰 번호로 로그인"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {method === "email"
              ? step === "input"
                ? "이메일 주소를 입력하세요"
                : "이메일을 확인해 주세요"
              : step === "input"
                ? "휴대폰 번호를 입력하세요"
                : `${formatPhone(phone)}로 발송된 6자리 입력`}
          </p>
        </div>

        {/* 카카오 로그인 */}
        <button
          type="button"
          onClick={handleKakaoLogin}
          className="w-full mb-2 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors hover:opacity-90"
          style={{ backgroundColor: "#FEE500", color: "#000" }}
        >
          카카오로 시작하기
        </button>
        <p className="text-xs text-gray-400 mb-4 text-center">
          카카오 오류 시 →{" "}
          <a
            href="https://supabase.com/dashboard/project/cykzrqbifpvuwdsbzyzy/auth/providers"
            target="_blank"
            rel="noopener noreferrer"
            className="text-mimi-orange hover:underline"
          >
            Supabase에서 Kakao Enable
          </a>
          <br />
          <span className="text-gray-400">(Supabase URL에 cykzrqbifpvuwdsbzyzy 인 프로젝트에서 설정)</span>
        </p>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-500">또는</span>
          </div>
        </div>

        {/* 로그인 방식 선택 */}
        <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-xl">
          <button
            type="button"
            onClick={() => { setMethod("email"); resetStep(); setEmail(""); setPhone(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              method === "email" ? "bg-white shadow text-mimi-orange" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            이메일
          </button>
          <button
            type="button"
            onClick={() => { setMethod("phone"); resetStep(); setEmail(""); setPhone(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              method === "phone" ? "bg-white shadow text-mimi-orange" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            휴대폰
          </button>
        </div>

        {DEMO_MODE && (
          <div className="mb-4 p-3 bg-mimi-yellow/30 rounded-lg text-center text-sm text-amber-800">
            데모 모드 · {method === "phone" ? "아무 6자리 입력" : "이메일 입력 후 버튼 클릭"}
          </div>
        )}

        {/* 휴대폰 로그인 */}
        {method === "phone" && (
          step === "input" ? (
            <form onSubmit={handlePhone} className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">휴대폰 번호</label>
              <input
                type="tel"
                value={formatPhone(phone)}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="010-1234-5678"
                inputMode="numeric"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none text-lg"
                maxLength={13}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-mimi-orange text-white font-bold rounded-xl hover:bg-mimi-orange/90 disabled:opacity-60"
              >
                {loading ? "발송 중..." : "인증번호 받기"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtp} className="space-y-4">
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none text-lg text-center tracking-[0.5em]"
                maxLength={6}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-mimi-orange text-white font-bold rounded-xl hover:bg-mimi-orange/90 disabled:opacity-60"
              >
                {loading ? "확인 중..." : "로그인"}
              </button>
              <button
                type="button"
                onClick={resetStep}
                className="w-full py-2 text-gray-500 text-sm hover:text-mimi-orange"
              >
                번호 변경
              </button>
            </form>
          )
        )}

        {/* 이메일 로그인 */}
        {method === "email" && (
          step === "input" ? (
            <form onSubmit={handleEmail} className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">이메일 주소</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none text-lg"
              />
              {error && (
                <div className="space-y-1">
                  <p className="text-sm text-red-500">{error}</p>
                  {rateLimitHit && method === "email" && (
                    <button
                      type="button"
                      onClick={() => { setMethod("phone"); resetStep(); setEmail(""); setPhone(""); }}
                      className="text-sm text-mimi-orange hover:underline"
                    >
                      휴대폰 번호로 로그인 →
                    </button>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-mimi-orange text-white font-bold rounded-xl hover:bg-mimi-orange/90 disabled:opacity-60"
              >
                {loading ? "발송 중..." : "로그인 링크 받기"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 text-center">
                <strong>{email}</strong>로 로그인 링크를 보냈어요.
                <br />
                이메일을 확인하고 링크를 클릭해 주세요.
              </p>
              {(DEMO_MODE || !isSupabaseConfigured()) ? (
                <button
                  type="button"
                  onClick={handleDemoEmailLogin}
                  className="w-full py-3 bg-mimi-orange text-white font-bold rounded-xl hover:bg-mimi-orange/90"
                >
                  데모: 바로 로그인
                </button>
              ) : (
                <p className="text-xs text-gray-500 text-center">
                  링크가 보이지 않나요? 스팸함을 확인해 보세요.
                </p>
              )}
              <button
                type="button"
                onClick={resetStep}
                className="w-full py-2 text-gray-500 text-sm hover:text-mimi-orange"
              >
                이메일 변경
              </button>
            </div>
          )
        )}
      </div>

      <p className="mt-6 text-sm text-gray-500">
        <Link href="/" className="text-mimi-orange hover:underline">홈으로</Link>
      </p>
    </>
  );
}
