"use client";

import { createContext, useContext, useEffect, useState } from "react";

type AuthState = {
  /** 이메일 로그인은 phone 없이 email 만 있을 수 있음 */
  user: { phone?: string; email?: string; demo?: boolean } | null;
  isLoading: boolean;
  logout: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const skipCustomerAuth = process.env.NEXT_PUBLIC_SKIP_CUSTOMER_AUTH === "true";
const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_AUTH === "true" ||
  !supabaseUrl ||
  !supabaseUrl.startsWith("http");

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ phone?: string; email?: string; demo?: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (skipCustomerAuth) {
      setUser({ phone: "local" });
      setIsLoading(false);
      return;
    }
    if (isDemoMode) {
      try {
        const stored = localStorage.getItem("mimi_demo_user");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.phone) setUser({ phone: parsed.phone, demo: true });
        }
      } catch {
        // ignore
      }
      setIsLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;
    const initSupabase = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const supabaseUser = userData?.user;
        if (supabaseUser?.phone) {
          setUser({ phone: supabaseUser.phone, email: supabaseUser.email ?? undefined });
        } else if (supabaseUser?.email) {
          setUser({ email: supabaseUser.email });
        }
        const { data: subData } = supabase.auth.onAuthStateChange((_event, session) => {
          const u = session?.user;
          if (u?.phone) {
            setUser({ phone: u.phone, email: u.email ?? undefined });
          } else if (u?.email) {
            setUser({ email: u.email });
          } else {
            setUser(null);
          }
        });
        unsubscribe = () => subData?.subscription?.unsubscribe();
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    initSupabase();
    return () => unsubscribe?.();
  }, []);

  const logout = () => {
    localStorage.removeItem("mimi_demo_user");
    if (skipCustomerAuth) {
      window.location.assign("/");
      return;
    }
    if (isDemoMode) {
      window.location.assign("/");
      return;
    }
    import("@/lib/supabase/client")
      .then(({ createClient }) => createClient().auth.signOut())
      .catch(() => {})
      .finally(() => {
        // 상태 업데이트 없이 즉시 리다이렉트 (다른 컴포넌트와 충돌해 Internal Server Error 발생 방지)
        window.location.assign("/");
      });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
