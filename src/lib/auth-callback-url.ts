/**
 * 이메일·OAuth redirect_to 에 넣는 콜백 URL.
 */
const DEFAULT_PRODUCTION_ORIGIN = "https://mimisalon.vercel.app";

export function getAuthCallbackUrl(): string {
  // 서버 사이드 렌더링 시 기본값 반환
  if (typeof window === "undefined") {
    return `${DEFAULT_PRODUCTION_ORIGIN}/auth/callback?next=%2F`;
  }
  
  // 안전한 리디렉션 URL 생성
  try {
    // 리디렉션 경로 안전하게 가져오기
    let redirect = "/";
    try {
      const params = new URLSearchParams(window.location.search || "");
      const redirectParam = params.get("redirect");
      if (redirectParam && typeof redirectParam === 'string') {
        redirect = redirectParam.startsWith("/") ? redirectParam : `/${redirectParam}`;
      }
    } catch (e) {
      console.error("리디렉션 파라미터 파싱 오류:", e);
    }
    
    // 항상 프로덕션 URL 사용
    return `${DEFAULT_PRODUCTION_ORIGIN}/auth/callback?next=${encodeURIComponent(redirect)}`;
  } catch (e) {
    console.error("콜백 URL 생성 오류:", e);
    return `${DEFAULT_PRODUCTION_ORIGIN}/auth/callback?next=%2F`;
  }
}