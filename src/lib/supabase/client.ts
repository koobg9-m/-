import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  if (typeof window === "undefined") {
    throw new Error("Supabase client can only be used in the browser");
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl || !supabaseAnonKey || !supabaseUrl.startsWith("http")) {
    throw new Error("Missing or invalid Supabase environment variables");
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/** Supabase 사용 가능 여부 */
export function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return !!url && !!key && url.startsWith("http");
}
