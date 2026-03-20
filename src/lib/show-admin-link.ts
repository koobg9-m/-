/**
 * 푸터 「관리자」 링크 표시 여부
 * - `npm run dev`(NODE_ENV=development): 항상 표시 → 로컬에서 수정 가능
 * - 프로덕션 빌드/배포: NEXT_PUBLIC_SHOW_ADMIN_LINK=1|true 일 때만 (기본 비노출)
 */
export function shouldShowAdminLinkInFooter(): boolean {
  if (process.env.NODE_ENV === "development") {
    return true;
  }
  const v = process.env.NEXT_PUBLIC_SHOW_ADMIN_LINK;
  return v === "1" || v === "true";
}
