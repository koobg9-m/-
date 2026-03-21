"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

/** Supabase가 리다이렉트에 실을 수 있는 OTP 타입 (token_hash 플로우) */
const OTP_TYPES = new Set(["email", "signup", "magiclink", "recovery", "invite", "email_change"]);

function isOtpType(t: string | null): t is "email" | "signup" | "magiclink" | "recovery" | "invite" | "email_change" {
  return !!t && OTP_TYPES.has(t);
}

/**
 * implicit(#access_token) / 지연 파싱 대응: 해시·쿼리 토큰이 들어온 뒤 세션이 잡힐 때까지 대기
 */
function waitForAuthSession(supabase: SupabaseClient, maxMs = 25000): Promise<Session | null> {
  return new Promise((resolve) => {
    let finished = false;
    let pollIv: ReturnType<typeof setInterval> | undefined;
    let sub: { unsubscribe: () => void } | undefined;

    const finish = (s: Session | null) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (pollIv) clearInterval(pollIv);
      try {
        sub?.unsubscribe();
      } catch {
        /* ignore */
      }
      resolve(s);
    };

    const timer = setTimeout(() => finish(null), maxMs);

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
        finish(session);
      }
    });
    sub = data?.subscription;

    let polls = 0;
    pollIv = setInterval(async () => {
      polls += 1;
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (!error && session) {
        finish(session);
        return;
      }
      if (polls > 150 && pollIv) {
        clearInterval(pollIv);
        pollIv = undefined;
      }
    }, 160);
  });
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError("Supabase 설정이 없습니다.");
      return;
    }

    const run = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const nextRaw = searchParams.get("next") ?? searchParams.get("redirect") ?? "/";
      const next = nextRaw.startsWith("/") ? nextRaw : "/";

      // Supabase 오류 리다이렉트 (?error=...&error_description=...)
      const errParam = searchParams.get("error");
      const errDesc = searchParams.get("error_description");
      if (errParam) {
        const decoded = errDesc ? decodeURIComponent(errDesc.replace(/\+/g, " ")) : errParam;
        setError(decoded || "인증에 실패했습니다.");
        return;
      }

      // PKCE code
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          router.replace(next);
          return;
        }
        const msg = exchangeError.message ?? "";
        if (msg.includes("code verifier") || msg.toLowerCase().includes("pkce")) {
          // 다른 기기에서 연 PKCE 실패 → implicit 해시만 온 경우 등, 세션 대기 재시도
          const session = await waitForAuthSession(supabase);
          if (session) {
            router.replace(next);
            return;
          }
          setError(
            "이 링크는 로그인을 요청한 브라우저와 달라 완료할 수 없습니다. 같은 기기에서 메일을 열거나, 다시 「로그인 링크 받기」를 해 주세요.",
          );
          return;
        }
        const sessionRetry = await waitForAuthSession(supabase, 8000);
        if (sessionRetry) {
          router.replace(next);
          return;
        }
        setError("인증에 실패했습니다. 링크가 만료되었을 수 있습니다.");
        return;
      }

      // token_hash + type
      const token_hash = searchParams.get("token_hash");
      const typeRaw = searchParams.get("type");
      if (token_hash && isOtpType(typeRaw)) {
        const { error: otpError } = await supabase.auth.verifyOtp({ token_hash, type: typeRaw });
        if (!otpError) {
          router.replace(next);
          return;
        }
        setError(otpError.message || "인증에 실패했습니다.");
        return;
      }

      const session = await waitForAuthSession(supabase);
      if (session) {
        router.replace(next);
        return;
      }

      setError(
        "로그인을 완료하지 못했습니다. 링크가 만료되었거나, 메일 앱이 주소를 잘못 열었을 수 있습니다. 다시 로그인 링크를 받거나, 다른 브라우저에서 메일 링크를 열어 보세요.",
      );
    };

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 콜백 진입 1회만 처리
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-mimi-yellow/20 via-white to-mimi-orange/10 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-md">
          <span className="text-6xl">⚠️</span>
          <h1 className="text-xl font-bold text-gray-800 mt-4">{error}</h1>
          <Link
            href="/login"
            className="inline-block mt-6 px-8 py-3 bg-mimi-orange text-white rounded-full font-bold hover:bg-mimi-orange/90"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-mimi-yellow/20 via-white to-mimi-orange/10 flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <span className="text-4xl animate-bounce">🐾</span>
        <p className="mt-4 text-gray-600">로그인 처리 중...</p>
        <p className="mt-2 text-xs text-stone-500">잠시만 기다려 주세요. 메일 앱에서 열리면 조금 걸릴 수 있어요.</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-mimi-yellow/20 via-white to-mimi-orange/10 flex flex-col items-center justify-center p-6">
          <div className="text-center">
            <span className="text-4xl animate-bounce">🐾</span>
            <p className="mt-4 text-gray-600">로그인 처리 중...</p>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
