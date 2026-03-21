/**
 * 푸터 「관리자」 링크 표시 여부
 * - 개발: 항상 표시
 * - 프로덕션: 기본 표시 (비밀번호로 보호). 숨기려면 NEXT_PUBLIC_HIDE_ADMIN_LINK=1
 */
export function shouldShowAdminLinkInFooter(): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  const hide = process.env.NEXT_PUBLIC_HIDE_ADMIN_LINK;
  if (hide === "1" || hide === "true") {
    return false;
  }
  return true;
}
