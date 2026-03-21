/**
 * 이메일·OAuth redirect_to 에 넣는 콜백 URL.
 *
 * 로컬(localhost)에서 요청 시 기본값이 `http://localhost/.../auth/callback` 이면
 * - PC에 `npm run dev`가 안 떠 있을 때 → ERR_CONNECTION_REFUSED
 * - 휴대폰에서 메일 링크를 열면 → 그 기기의 localhost로 가서 실패
 *
 * **우선순위**
 * 1. `NEXT_PUBLIC_SITE_URL` 이 있으면 그 origin (명시 설정)
 * 2. localhost 이고, 아래 옵트아웃이 없으면 → 프로덕션 기본 도메인 (메일·다른 기기에서 동작)
 * 3. 그 외 → `window.location.origin`
 *
 * 로컬에서만 이메일 링크를 `http://localhost:5006/...` 로 받고 싶다면:
 * `.env.local` 에 `NEXT_PUBLIC_USE_LOCAL_AUTH_CALLBACK=1` 추가
 */
const DEFAULT_PRODUCTION_ORIGIN = "https://mimisalon.vercel.app";

export function getAuthCallbackUrl(): string {
  if (typeof window === "undefined") return "";
  const redirect = new URLSearchParams(window.location.search).get("redirect") || "/";
  let origin = window.location.origin;
  const envSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const isLocal =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const forceLocalCallback = process.env.NEXT_PUBLIC_USE_LOCAL_AUTH_CALLBACK === "1";

  if (envSite) {
    try {
      origin = new URL(envSite).origin;
    } catch {
      /* invalid NEXT_PUBLIC_SITE_URL — keep window.location.origin */
    }
  } else if (isLocal && !forceLocalCallback) {
    origin = DEFAULT_PRODUCTION_ORIGIN;
  }

  return `${origin}/auth/callback?next=${encodeURIComponent(redirect)}`;
}
