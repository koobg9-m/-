/**
 * 이메일·OAuth redirect_to / emailRedirectTo 에 넣는 콜백 URL.
 *
 * ※ 메일 링크가 localhost 로 가면 ERR_CONNECTION_REFUSED 가 납니다.
 *   - Supabase 대시보드 → Authentication → URL Configuration → Site URL 을
 *     운영 도메인(예: https://mimisalon.vercel.app)으로 두세요. localhost 금지(운영 시).
 *   - Redirect URLs 에 콜백 경로가 허용 목록에 있어야 합니다.
 */

const FALLBACK_ORIGIN = "https://mimisalon.vercel.app";

/** 이 레포의 `npm run dev` 기본 포트 (Next 기본 3000 과 다름) */
const DEFAULT_LOCAL_DEV_ORIGIN = "http://localhost:5006";

function trimOrigin(url: string): string {
  return url.replace(/\/$/, "");
}

/** 브라우저·빌드 타임 공통: 사이트 공개 URL (Vercel 환경 변수 권장) */
export function getSiteOrigin(): string {
  const fromEnv =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_SITE_URL
      ? trimOrigin(process.env.NEXT_PUBLIC_SITE_URL.trim())
      : "";
  if (fromEnv && /^https?:\/\//i.test(fromEnv)) {
    return fromEnv;
  }
  /**
   * 로컬에서 이메일/카카오 콜백을 이 PC로 받을 때.
   * Supabase 대시보드 Site URL 이 Next 기본값 localhost:3000 이면 메일 링크가
   * http://localhost:3000/#access_token 로 가서 연결 거부·호스트 불일치가 납니다.
   * 이 프로젝트는 dev 포트가 5006 이므로, 여기서는 3000 대신 5006(또는 LOCAL_DEV_ORIGIN)을 씁니다.
   */
  if (process.env.NEXT_PUBLIC_USE_LOCAL_AUTH_CALLBACK === "1") {
    const localExplicit =
      typeof process !== "undefined"
        ? process.env.NEXT_PUBLIC_LOCAL_DEV_ORIGIN?.trim()
        : "";
    if (localExplicit && /^https?:\/\//i.test(localExplicit)) {
      return trimOrigin(localExplicit);
    }
    if (typeof window !== "undefined") {
      const { hostname, port } = window.location;
      if ((hostname === "localhost" || hostname === "127.0.0.1") && port === "5006") {
        return window.location.origin;
      }
    }
    return DEFAULT_LOCAL_DEV_ORIGIN;
  }
  return FALLBACK_ORIGIN;
}

/**
 * 로그인 후 돌아올 /auth/callback 전체 URL (?next= 포함)
 */
export function getAuthCallbackUrl(): string {
  let redirect = "/";
  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams(window.location.search || "");
      const redirectParam = params.get("redirect");
      if (redirectParam && typeof redirectParam === "string") {
        redirect = redirectParam.startsWith("/") ? redirectParam : `/${redirectParam}`;
      }
    } catch {
      /* ignore */
    }
  }

  const origin = getSiteOrigin();
  const next = encodeURIComponent(redirect);
  return `${origin}/auth/callback?next=${next}`;
}
