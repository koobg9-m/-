"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const SKIP_CUSTOMER_AUTH = process.env.NEXT_PUBLIC_SKIP_CUSTOMER_AUTH === "true";

export default function HeaderNav() {
  const router = useRouter();
  const [user, setUser] = useState<{ phone?: string; email?: string } | null>(null);

  useEffect(() => {
    if (SKIP_CUSTOMER_AUTH) {
      setUser({ phone: "local" });
      return;
    }
    const checkAuth = async () => {
      try {
        const stored = localStorage.getItem("mimi_demo_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.phone || parsed?.email) {
            setUser({ phone: parsed.phone, email: parsed.email });
            return;
          }
        }
        if (isSupabaseConfigured()) {
          const { createClient } = await import("@/lib/supabase/client");
          const { data: { session } } = await createClient().auth.getSession();
          if (session?.user?.email) {
            setUser({ email: session.user.email });
          }
        }
      } catch {
        // ignore
      }
    };
    checkAuth();
  }, []);

  const logout = async () => {
    try {
      if (SKIP_CUSTOMER_AUTH) {
        router.replace("/");
        return;
      }
      localStorage.removeItem("mimi_demo_user");
      if (isSupabaseConfigured()) {
        try {
          const { createClient } = await import("@/lib/supabase/client");
          await createClient().auth.signOut();
        } catch {
          // ignore
        }
      }
      setUser(null);
      router.replace("/");
    } catch (e) {
      router.replace("/");
    }
  };

  return (
    <nav className="flex items-center gap-3 sm:gap-6 md:gap-8 flex-wrap justify-end min-w-0">
      <Link href="/mypage" className="text-sm text-mimi-slate hover:text-mimi-primary transition-colors font-medium">
        마이페이지
      </Link>
      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-stone-500 truncate max-w-[140px]">{user.phone === "local" ? "로컬" : (user.email ?? user.phone)}</span>
          <button
            onClick={logout}
            className="text-sm text-mimi-slate hover:text-mimi-primary transition-colors font-medium"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <Link href="/login" className="text-sm text-mimi-slate hover:text-mimi-primary transition-colors font-medium">
          로그인
        </Link>
      )}
      <Link
        href="/booking"
        className="btn-primary text-xs sm:text-sm py-2 px-4 sm:py-2.5 sm:px-5"
      >
        예약하기
      </Link>
    </nav>
  );
}
