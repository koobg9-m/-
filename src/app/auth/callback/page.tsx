"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError("설정 오류");
      return;
    }

    const run = async () => {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const next = searchParams.get("next") ?? searchParams.get("redirect") ?? "/";

      // OAuth: code 파라미터가 있으면 exchangeCodeForSession (카카오 등)
      const code = searchParams.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeError) {
          router.replace(next);
          return;
        }
        setError("인증 실패");
        return;
      }

      // 해시(#)에 토큰이 있으면 Supabase가 자동으로 세션 설정 (이메일 링크 등)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        setError("인증 실패");
        return;
      }

      if (session) {
        router.replace(next);
        return;
      }

      // 해시가 있는데 아직 세션 없으면 잠시 대기 (Supabase가 파싱 중일 수 있음)
      if (typeof window !== "undefined" && window.location.hash) {
        await new Promise((r) => setTimeout(r, 500));
        const { data: { session: s2 } } = await supabase.auth.getSession();
        if (s2) {
          router.replace(next);
          return;
        }
      }

      setError("로그인 링크가 만료되었거나 잘못되었습니다.");
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchParams는 초기 로드 시에만 사용
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
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-mimi-yellow/20 via-white to-mimi-orange/10 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <span className="text-4xl animate-bounce">🐾</span>
          <p className="mt-4 text-gray-600">로그인 처리 중...</p>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
