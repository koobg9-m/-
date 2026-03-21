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
  // 서버 사이드 렌더링 시 기본값 반환
  if (typeof window === "undefined") return `${DEFAULT_PRODUCTION_ORIGIN}/auth/callback?next=%2F`;
  
  try {
    // 리디렉션 경로 안전하게 가져오기
    let redirect = "/";
    try {
      const params = new URLSearchParams(window.location.search);
      const redirectParam = params.get("redirect");
      if (redirectParam && typeof redirectParam === 'string') {
        // 경로가 /로 시작하는지 확인
        redirect = redirectParam.startsWith("/") ? redirectParam : `/${redirectParam}`;
      }
    } catch (e) {
      console.error("리디렉션 파라미터 파싱 오류:", e);
    }
    
    // 오리진 결정
    let origin = DEFAULT_PRODUCTION_ORIGIN; // 기본값으로 프로덕션 URL 사용
    
    // 환경 변수에서 사이트 URL 가져오기 시도
    const envSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (envSite) {
      try {
        const url = new URL(envSite);
        if (url.origin) {
          origin = url.origin;
        }
      } catch (e) {
        console.error("NEXT_PUBLIC_SITE_URL 파싱 오류:", e);
      }
    } 
    // 환경 변수가 없으면 현재 위치 확인
    else {
      try {
        const isLocal = window.location.hostname === "localhost" || 
                       window.location.hostname === "127.0.0.1";
        const forceLocalCallback = process.env.NEXT_PUBLIC_USE_LOCAL_AUTH_CALLBACK === "1";
        
        // 로컬이고 강제 로컬 콜백이 아니면 프로덕션 URL 사용 (이미 기본값으로 설정됨)
        // 그 외에는 현재 오리진 사용
        if (!isLocal || forceLocalCallback) {
          if (window.location.origin) {
            origin = window.location.origin;
          }
        }
      } catch (e) {
        console.error("window.location 접근 오류:", e);
        // 기본값인 DEFAULT_PRODUCTION_ORIGIN 유지
      }
    }
    
    // 최종 URL 생성
    return `${origin}/auth/callback?next=${encodeURIComponent(redirect)}`;
  } catch (e) {
    // 어떤 오류가 발생해도 기본 URL 반환
    console.error("콜백 URL 생성 오류:", e);
    return `${DEFAULT_PRODUCTION_ORIGIN}/auth/callback?next=%2F`;
  }
}
