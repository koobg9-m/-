import type { User } from "@supabase/supabase-js";

/** Supabase 세션 사용자 → 앱 로그인 식별자 (카카오 이메일·닉네임 메타데이터 포함) */
export function identityFromSupabaseUser(
  user: User | null | undefined
): { phone?: string; email?: string } | null {
  if (!user) return null;

  const kakao = user.user_metadata?.kakao_data as
    | { kakao_account?: { email?: string } }
    | undefined;
  const email = user.email ?? kakao?.kakao_account?.email ?? undefined;
  const phone = user.phone ? String(user.phone) : undefined;

  return { phone, email };
}

/** 예약·헤더에서 쓰는 localStorage 로그인 키 동기화 */
export function syncSessionIdentityToStorage(user: User | null | undefined): void {
  const id = identityFromSupabaseUser(user);
  if (!id?.phone && !id?.email) return;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("mimi_demo_user", JSON.stringify(id));
  } catch {
    // ignore
  }
}
