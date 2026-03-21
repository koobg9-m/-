import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * 브라우저 전용 Supabase 클라이언트 (싱글톤).
 *
 * **이메일 매직 링크:** `@supabase/ssr`의 `createBrowserClient`는 `flowType: "pkce"`를
 * 항상 덮어씁니다. PKCE는 `code_verifier`가 **로그인 요청한 브라우저**에만 있어,
 * 메일을 **다른 기기/앱**에서 열면 `exchangeCodeForSession`이 실패합니다.
 * `implicit` 플로우는 URL 해시의 토큰으로 세션을 만들어 교차 기기에서도 동작합니다.
 *
 * 카카오 OAuth도 동일 클라이언트로 처리합니다 (implicit).
 */
export function createClient(): SupabaseClient {
  if (typeof window === "undefined") {
    throw new Error("Supabase client can only be used in the browser");
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith("http")) {
    throw new Error("Missing or invalid Supabase environment variables");
  }

  if (!browserClient) {
    browserClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: "implicit",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

/** Supabase 사용 가능 여부 */
export function isSupabaseConfigured() {
  if (process.env.NEXT_PUBLIC_SKIP_SUPABASE === "1") return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return !!url && !!key && url.startsWith("http");
}
