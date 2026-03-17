import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-mimi-charcoal text-stone-300 mt-auto">
      <div className="page-container py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
<div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-6">
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
              <li><Link href="/services" className="hover:text-mimi-gold transition-colors">미용 패키지</Link></li>
              <li><Link href="/pricing" className="hover:text-mimi-gold transition-colors">요금 안내</Link></li>
              <li><Link href="/booking" className="hover:text-mimi-gold transition-colors">예약하기</Link></li>
              <li><Link href="/mypage" className="hover:text-mimi-gold transition-colors">마이페이지</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">고객지원</h4>
            <ul className="space-y-4">
              <li><Link href="/terms" className="hover:text-mimi-gold transition-colors">이용약관</Link></li>
              <li><Link href="/reservation-guide" className="hover:text-mimi-gold transition-colors">예약전 안내</Link></li>
              <li><Link href="/notice" className="hover:text-mimi-gold transition-colors">공지 & 이벤트</Link></li>
              <li><Link href="/tips" className="hover:text-mimi-gold transition-colors">육아 노하우</Link></li>
              <li><Link href="/privacy" className="hover:text-mimi-gold transition-colors">개인정보처리방침</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">고객센터</h4>
            <ul className="space-y-3 text-stone-400 text-sm">
              <li>
                <a href="mailto:koobg@naver.com" className="hover:text-mimi-gold transition-colors">koobg@naver.com</a>
              </li>
              <li>
                <a href="tel:010-4546-2955" className="hover:text-mimi-gold transition-colors">010-4546-2955</a>
              </li>
              <li className="pt-2 border-t border-stone-600">
                <Link href="/groomer" className="hover:text-mimi-gold transition-colors">디자이너</Link>
              </li>
              <li>
                <Link href="/groomer/register" className="hover:text-mimi-gold transition-colors font-medium">디자이너 신청하기</Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-mimi-gold transition-colors">관리자</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-700 mt-16 pt-8">
          <div className="text-stone-500 text-sm space-y-1 mb-6">
            <p>주소: 65-1, Sadang-ro, Dongjak-gu, Seoul, Korea (서울시 동작구 사당로 65-1)</p>
            <p>사업자등록번호: 828-87-000919 | 통신판매업신고: 2023-서울동작-0405</p>
            <p>대표: 구본기 | 개인정보관리책임자: 구본기</p>
            <p>연락처: 070-7651-9568 | 제휴·문의: <a href="mailto:koobg@naver.com" className="text-mimi-gold hover:underline">koobg@naver.com</a></p>
            <p>예약문의: <a href="tel:010-4546-2955" className="text-mimi-gold hover:underline font-medium">010-4546-2955</a></p>
          </div>
          <p className="text-center text-stone-500 text-sm">© 2025 미미살롱펫</p>
          <p className="text-center text-stone-500 text-xs mt-4 max-w-2xl mx-auto leading-relaxed">
            미미살롱펫은 통신판매중개자로서 통신판매의 당사자가 아니며, 디자이너가 등록한 상품정보 및 거래에 대해 책임을 지지 않습니다.
          </p>
        </div>
      </div>
    </footer>
  );
}
