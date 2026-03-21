import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return !!(
      supabaseUrl &&
      supabaseUrl.startsWith("http") &&
      supabaseAnonKey &&
      supabaseAnonKey.length > 10
    );
  } catch (e) {
    console.error("Supabase 설정 확인 오류:", e);
    return false;
  }
}

export function createClient(): SupabaseClient {
  try {
    if (supabaseInstance) return supabaseInstance;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase 환경 변수가 설정되지 않았습니다");
    }

    if (!supabaseUrl.startsWith("http")) {
      throw new Error("Supabase URL이 올바르지 않습니다");
    }

    supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        /** 매직 링크 후 /auth/callback 의 ?code= / #access_token 을 자동 파싱 */
        detectSessionInUrl: true,
      },
    });

    return supabaseInstance;
  } catch (error) {
    console.error("Supabase 클라이언트 생성 오류:", error);
    throw new Error("Supabase 클라이언트를 생성할 수 없습니다");
  }
}

export function checkSupabaseConfig(): {
  isConfigured: boolean;
  url?: string;
  hasAnonKey: boolean;
} {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const isConfigured = !!(
      supabaseUrl &&
      supabaseUrl.startsWith("http") &&
      supabaseAnonKey &&
      supabaseAnonKey.length > 10
    );
    
    return {
      isConfigured,
      url: supabaseUrl || undefined,
      hasAnonKey: !!supabaseAnonKey && supabaseAnonKey.length > 10,
    };
  } catch (e) {
    console.error("Supabase 설정 확인 오류:", e);
    return { isConfigured: false, hasAnonKey: false };
  }
}