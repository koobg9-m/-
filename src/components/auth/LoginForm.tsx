"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import LoginMethodGuide from "@/components/auth/LoginMethodGuide";
import { getAuthCallbackUrl } from "@/lib/auth-callback-url";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SKIP_CUSTOMER_AUTH = process.env.NEXT_PUBLIC_SKIP_CUSTOMER_AUTH === "true";
const DEMO_MODE =
  !SKIP_CUSTOMER_AUTH &&
  (process.env.NEXT_PUBLIC_DEMO_AUTH === "true" ||
    process.env.NEXT_PUBLIC_SKIP_SUPABASE === "1" ||
    !supabaseUrl ||
    !supabaseUrl.startsWith("http"));

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isRateLimitError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return lower.includes("rate limit") || lower.includes("429") || lower.includes("too many");
}

function formatAuthErrorEmail(msg: string): string {
  if (isRateLimitError(msg)) {
    return "이메일 발송 한도를 초과했어요. 잠시 후에 다시 시도해 주세요.";
  }
  return msg;
}

export default function LoginForm() {
  const [logoError, setLogoError] = useState(false);
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"input" | "email_sent">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLocalHost, setIsLocalHost] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const h = window.location.hostname;
      setIsLocalHost(h === "localhost" || h === "127.0.0.1");
    }
  }, []);

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

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
        const redirectTo = getAuthCallbackUrl();

        // Supabase 클라이언트 생성 및 로그인 시도
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        
        const { error: err } = await supabase.auth.signInWithOtp({
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
        setError(formatAuthErrorEmail(msg));
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
    setError("");
  };

  const handleKakaoLogin = async () => {
    if (DEMO_MODE || !isSupabaseConfigured()) {
      setError("카카오 로그인을 사용할 수 없습니다. (설정 확인 필요)");
      return;
    }
    
    setError("");
    setLoading(true);
    
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const redirectTo = getAuthCallbackUrl();

      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { 
          redirectTo,
          queryParams: {
            // 필요한 추가 권한 요청
            scope: "profile_nickname,profile_image,account_email"
          }
        },
      });
      
      if (err) throw err;
      
      // 성공 시 리디렉션은 Supabase가 자동으로 처리
      // 로컬에서 테스트하는 경우 수동 리디렉션
      if (data?.url && isLocalHost) {
        window.location.href = data.url;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "카카오 로그인 실패";
      console.error("카카오 로그인 오류:", err);
      
      if (msg.includes("provider is not enabled") || msg.includes("Unsupported provider")) {
        setError("카카오 로그인이 아직 준비되지 않았습니다. 이메일로 시도해 주세요.");
      } else if (msg.includes("popup_closed_by_user") || msg.includes("popup closed")) {
        setError("로그인 창이 닫혔습니다. 다시 시도해 주세요.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
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

      <div className="w-full max-w-sm card p-7 md:p-8 shadow-elevated border-stone-200">
        <div className="text-center mb-1">
          <h1 className="text-xl font-bold text-gray-800">로그인</h1>
          <p className="text-sm text-gray-500 mt-1">카카오톡 또는 이메일로 로그인하세요</p>
        </div>

        <LoginMethodGuide />

        {isLocalHost && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-left text-[12px] text-amber-900 leading-snug">
            <strong className="block mb-1">localhost / 연결 거부 안내</strong>
            이메일 링크가 <code className="text-[11px] bg-amber-100 px-1 rounded">localhost</code>로 열리면
            Supabase 대시보드 → Authentication → URL Configuration에서 <strong>Site URL</strong>을
            운영 주소(예: 배포 도메인)로 바꿔 주세요. 개발만 할 때는{" "}
            <code className="text-[11px]">NEXT_PUBLIC_USE_LOCAL_AUTH_CALLBACK=1</code> 과 켜진{" "}
            <code className="text-[11px]">npm run dev</code>가 필요합니다.
            <br />
            <a
              href="https://mimisalon.vercel.app/login"
              className="text-mimi-orange font-semibold underline underline-offset-2 mt-1 inline-block"
              target="_blank"
              rel="noopener noreferrer"
            >
              배포 로그인 페이지
            </a>
            에서 시도해 보세요.
          </div>
        )}

        <button
          type="button"
          onClick={handleKakaoLogin}
          disabled={loading}
          className="w-full mb-1.5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#FEE500", color: "#000" }}
        >
          {loading ? "처리 중..." : (
            <>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M9 0.5C4.02944 0.5 0 3.69066 0 7.68401C0 10.1894 1.55943 12.3958 3.93457 13.7485C3.63379 14.7753 3.26666 15.7638 2.83568 16.7045C2.81501 16.7469 2.80692 16.7947 2.81237 16.8419C2.81782 16.8891 2.83659 16.9336 2.86671 16.9703C2.89682 17.0071 2.93704 17.0347 2.98264 17.0498C3.02823 17.0649 3.07759 17.0669 3.12456 17.0557C4.2336 16.8198 5.30631 16.4395 6.31288 15.9232C7.17721 16.1547 8.0807 16.2727 9 16.2727C13.9706 16.2727 18 13.0774 18 9.08401C18 5.09066 13.9706 0.5 9 0.5Z" fill="currentColor"/>
              </svg>
              카카오로 시작하기
            </>
          )}
        </button>
        <p className="text-[11px] text-gray-400 mb-4 text-center">카카오 계정으로 연결됩니다</p>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-2 text-gray-500">또는</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-2 text-center">
          {step === "input" ? "이메일 주소를 입력하세요" : "메일함에서 로그인 링크를 확인하세요"}
        </p>
        {step === "input" && !DEMO_MODE && isSupabaseConfigured() && (
          <p className="text-[11px] text-stone-400 mb-2 text-center leading-snug">
            받은 링크는 PC·휴대폰 어디서 열어도 됩니다. 메일이 안 오면 스팸함을 확인해 주세요.
          </p>
        )}

        {DEMO_MODE && (
          <div className="mb-4 p-3 bg-mimi-yellow/30 rounded-lg text-center text-sm text-amber-800">
            데모 모드 · 이메일 입력 후 버튼 클릭
          </div>
        )}

        {step === "input" ? (
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
              <div className="space-y-2">
                <p className="text-sm text-red-500">{error}</p>
                {/magic link|sending.*email|smtp|email.*send/i.test(error) && (
                  <div className="text-[11px] text-stone-700 bg-amber-50 border border-amber-200 rounded-lg p-3 leading-snug">
                    <p className="font-semibold text-amber-900 mb-1">메일 발송 오류일 때 (관리자 확인)</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Supabase → <strong>Project Settings → Authentication → SMTP</strong>: Brevo Host/Port/Login/
                        <strong>새 SMTP key</strong> 저장 후 <strong>Save</strong>
                      </li>
                      <li>Brevo에서 키를 지웠다면 <strong>새 키를 Supabase에 다시 넣어야</strong> 합니다.</li>
                      <li>발신 이메일(Sender)이 Brevo에서 <strong>인증된 주소</strong>인지 확인</li>
                      <li>Supabase → Authentication → <strong>Logs</strong>에서 빨간 오류 문구 확인</li>
                    </ul>
                  </div>
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
              <p className="text-xs text-gray-500 text-center">링크가 보이지 않나요? 스팸함을 확인해 보세요.</p>
            )}
            <button
              type="button"
              onClick={resetStep}
              className="w-full py-2 text-gray-500 text-sm hover:text-mimi-orange"
            >
              이메일 변경
            </button>
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-gray-500">
        <Link href="/" className="text-mimi-orange hover:underline">
          홈으로
        </Link>
      </p>
    </>
  );
}