/** 관리자 인증 쿠키 (미들웨어에서 접근 제어용) */

const COOKIE_NAME = "mimi_admin_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24시간

/** 쿠키 설정 (클라이언트, 로그인 성공 시 호출) */
export function setAdminAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

/** 쿠키 삭제 (로그아웃 시 호출) - 강화된 버전 */
export function clearAdminAuthCookie(): void {
  if (typeof document === "undefined") return;
  
  // 여러 경로와 도메인 조합으로 쿠키 삭제 시도
  const paths = ['/', '/admin', '/admin/login'];
  const domains = ['', window.location.hostname, `.${window.location.hostname}`];
  
  // 모든 가능한 조합으로 쿠키 삭제 시도
  for (const path of paths) {
    for (const domain of domains) {
      // 도메인 지정
      if (domain) {
        document.cookie = `${COOKIE_NAME}=; path=${path}; domain=${domain}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      } else {
        document.cookie = `${COOKIE_NAME}=; path=${path}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    }
  }
  
  // 세션 스토리지와 로컬 스토리지도 함께 정리
  try {
    sessionStorage.removeItem("mimi_admin_authenticated");
    localStorage.removeItem("mimi_admin_authenticated");
  } catch (e) {
    // 무시
  }
}

/** 쿠키 존재 여부 확인 (클라이언트) */
export function hasAdminAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.includes(`${COOKIE_NAME}=`);
}
