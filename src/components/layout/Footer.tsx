import Link from "next/link";
import { SITE_COPYRIGHT_YEAR, SITE_VERSION } from "@/lib/site-version";
import { shouldShowAdminLinkInFooter } from "@/lib/show-admin-link";

/** 푸터 다수 링크: 호버 prefetch 비활성화로 INP(상호작용 지연) 완화 */
const navClass = "hover:text-mimi-gold transition-colors duration-150";

export default function Footer() {
  return (
    <footer className="bg-mimi-charcoal text-stone-300 mt-auto overflow-x-hidden">
      <div className="page-container py-12 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-12">
          <div className="col-span-2 md:col-span-2">
            <Link href="/" prefetch={false} className="flex items-center gap-2 mb-6">
              <span className="text-2xl">🐾</span>
              <span className="text-xl font-brand font-bold text-white tracking-[0.08em]">미미살롱펫</span>
            </Link>
            <p className="text-stone-400 max-w-sm leading-relaxed">
              찾아가는 펫 미용 서비스. 전문 그루머가 가정을 방문하여
              강아지를 위한 편안한 미용을 제공합니다.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">서비스</h4>
            <ul className="space-y-4">
              <li>
                <Link prefetch={false} href="/services" className={navClass}>
                  미용 패키지
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/pricing" className={navClass}>
                  요금 안내
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/booking" className={navClass}>
                  예약하기
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/mypage" className={navClass}>
                  마이페이지
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/qr" className={navClass}>
                  QR코드
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">고객지원</h4>
            <ul className="space-y-4">
              <li>
                <Link prefetch={false} href="/qna" className={`${navClass} font-semibold text-mimi-gold`}>
                  문의·Q&amp;A
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/terms" className={navClass}>
                  이용약관
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/reservation-guide" className={navClass}>
                  예약전 안내
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/notice" className={navClass}>
                  공지 & 이벤트
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/tips" className={navClass}>
                  육아 노하우
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/privacy" className={navClass}>
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">고객센터</h4>
            <ul className="space-y-3 text-stone-400 text-sm">
              <li>
                <a href="mailto:koobg@naver.com" className={navClass}>
                  koobg@naver.com
                </a>
              </li>
              <li>
                <a href="tel:010-4546-2955" className={navClass}>
                  010-4546-2955
                </a>
              </li>
              <li className="pt-2 border-t border-stone-600">
                <Link prefetch={false} href="/groomer" className={navClass}>
                  디자이너
                </Link>
              </li>
              <li>
                <Link prefetch={false} href="/groomer/register" className={`${navClass} font-medium`}>
                  디자이너 신청하기
                </Link>
              </li>
              {shouldShowAdminLinkInFooter() && (
                <li>
                  <Link prefetch={false} href="/admin" className={navClass}>
                    관리자
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-700 mt-12 md:mt-16 pt-6 md:pt-8">
          <div className="text-stone-500 text-xs sm:text-sm space-y-1 mb-6 break-words">
            <p>주소: 65-1, Sadang-ro, Dongjak-gu, Seoul, Korea (서울시 동작구 사당로 65-1)</p>
            <p className="break-words">사업자등록번호: 828-87-000919 | 통신판매업신고: 2023-서울동작-0405</p>
            <p>대표: 구본기 | 개인정보관리책임자: 구본기</p>
            <p>
              연락처: 070-7651-9568 | 제휴·문의:{" "}
              <a href="mailto:koobg@naver.com" className="text-mimi-gold hover:underline">
                koobg@naver.com
              </a>
            </p>
            <p>
              예약문의:{" "}
              <a href="tel:010-4546-2955" className="text-mimi-gold hover:underline font-medium">
                010-4546-2955
              </a>
            </p>
          </div>
          <p className="text-center text-stone-500 text-sm">
            © {SITE_COPYRIGHT_YEAR} 미미살롱펫{" "}
            <span className="text-stone-600 font-medium">({SITE_VERSION})</span>
          </p>
          <p className="text-center text-stone-500 text-xs mt-4 max-w-2xl mx-auto leading-relaxed">
            미미살롱펫은 통신판매중개자로서 통신판매의 당사자가 아니며, 디자이너가 등록한 상품정보 및 거래에 대해 책임을 지지 않습니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
