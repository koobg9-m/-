"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link href="/" className="text-mimi-primary hover:text-mimi-primaryDark transition-colors mb-4 inline-block">← 홈으로</Link>
          <h1 className="text-2xl font-bold text-mimi-charcoal mb-8">개인정보처리방침</h1>

          <div className="card p-6 md:p-8 bg-white space-y-8">
            {/* 1. 개인정보의 수집 및 이용목적 */}
            <section>
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">1. 개인정보의 수집 및 이용목적</h2>
              <p className="text-mimi-charcoal mb-4">회사는 다음의 목적을 위하여 개인정보를 처리합니다.</p>
              <ul className="text-mimi-charcoal text-sm space-y-2 list-disc list-inside">
                <li>회원제 서비스 제공에 따른 본인 식별·인증</li>
                <li>반려동물 미용 예약 및 관리</li>
                <li>결제 및 정산 처리</li>
                <li>고객 상담, 불만처리, 공지사항 전달</li>
                <li>마케팅 및 광고에 활용</li>
              </ul>
            </section>

            {/* 2. 수집하는 개인정보 항목 */}
            <section>
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">2. 수집하는 개인정보 항목</h2>
              <h3 className="font-bold text-mimi-charcoal mt-4 mb-2">필수항목</h3>
              <ul className="text-mimi-charcoal text-sm space-y-1 list-disc list-inside">
                <li>이메일 주소, 비밀번호</li>
                <li>이름, 연락처</li>
                <li>반려동물 정보 (이름, 종류, 나이, 특이사항)</li>
                <li>서비스 이용 기록, 접속 로그</li>
              </ul>
              <h3 className="font-bold text-mimi-charcoal mt-4 mb-2">선택항목</h3>
              <ul className="text-mimi-charcoal text-sm space-y-1 list-disc list-inside">
                <li>프로필 사진</li>
                <li>주소</li>
                <li>생년월일</li>
              </ul>
            </section>

            {/* 3. 개인정보의 보유 및 이용기간 */}
            <section>
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">3. 개인정보의 보유 및 이용기간</h2>
              <p className="text-mimi-charcoal text-sm mb-4">
                회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.
              </p>
              <ul className="text-mimi-charcoal text-sm space-y-2 list-disc list-inside">
                <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
                <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
                <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
              </ul>
            </section>

            {/* 4. 개인정보의 파기 */}
            <section>
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">4. 개인정보의 파기</h2>
              <p className="text-mimi-charcoal text-sm leading-relaxed">
                회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다. 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하며, 종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.
              </p>
            </section>

            {/* 5. 개인정보 보호책임자 */}
            <section>
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">5. 개인정보 보호책임자</h2>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <h3 className="font-bold text-mimi-charcoal mb-3">개인정보 보호책임자</h3>
                <ul className="text-mimi-charcoal text-sm space-y-2">
                  <li><strong>성명:</strong> 구본기</li>
                  <li><strong>직책:</strong> 개인정보보호팀장</li>
                  <li><strong>이메일:</strong> <a href="mailto:koobg@naver.com" className="text-mimi-primary hover:underline">koobg@naver.com</a></li>
                  <li><strong>전화번호:</strong> +82-10-4043-9775</li>
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
