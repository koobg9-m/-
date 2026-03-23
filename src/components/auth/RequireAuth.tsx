"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const SKIP_CUSTOMER_AUTH = process.env.NEXT_PUBLIC_SKIP_CUSTOMER_AUTH === "true";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ phone?: string; email?: string } | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const syncCustomerAuthToLocalStorage = (next: { phone?: string; email?: string } | null) => {
    try {
      if (!next || (!next.phone && !next.email)) {
        localStorage.removeItem("mimi_demo_user");
        return;
      }
      // 기존 고객 정보가 남아있어서 예약 화면이 과거 주소를 보여주는 문제를 막기 위함
      localStorage.setItem(
        "mimi_demo_user",
        JSON.stringify({ phone: next.phone, email: next.email })
      );
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (SKIP_CUSTOMER_AUTH) {
      setUser({ phone: "local" });
      setReady(true);
      return;
    }
    const checkAuth = async () => {
      try {
        const stored = localStorage.getItem("mimi_demo_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.phone || parsed?.email) {
            setUser({ phone: parsed.phone, email: parsed.email });
            syncCustomerAuthToLocalStorage({ phone: parsed.phone, email: parsed.email });
            return;
          }
        }
        if (isSupabaseConfigured()) {
          const { createClient } = await import("@/lib/supabase/client");
          const { data } = await createClient().auth.getSession();
          const session = data?.session;
          if (session?.user?.email) {
            const email = session.user.email;
            setUser({ email });
            syncCustomerAuthToLocalStorage({ email });
            return;
          }
        }
      } catch {
        // ignore
      }
      setUser(null);
      syncCustomerAuthToLocalStorage(null);
    };
    checkAuth().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/booking")}`);
    }
  }, [user, ready, router, pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-mimi-yellow/20 to-mimi-orange/10">
        <div className="animate-pulse text-center">
          <span className="text-4xl">🐾</span>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-mimi-yellow/20 to-mimi-orange/10">
        <div className="text-center max-w-md">
          <span className="text-6xl">🔐</span>
          <h1 className="text-2xl font-bold text-gray-800 mt-4">로그인이 필요해요</h1>
          <p className="text-gray-600 mt-2">예약을 하려면 먼저 로그인해 주세요.</p>
          <Link
            href="/login"
            className="inline-block mt-6 px-8 py-3 bg-mimi-orange text-white rounded-full font-bold hover:bg-mimi-orange/90 transition-colors"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
