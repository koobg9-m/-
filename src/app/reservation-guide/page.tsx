"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

export default function ReservationGuidePage() {
  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link href="/" className="text-mimi-primary hover:text-mimi-primaryDark transition-colors mb-4 inline-block">← 홈으로</Link>
          <h1 className="text-2xl font-bold text-mimi-charcoal mb-8">예약전 안내</h1>

          <div className="card p-6 md:p-8 bg-white space-y-8">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-100">
              <p className="text-mimi-charcoal leading-relaxed">
                미미살롱펫은 고객 만족을 위해 최선을 다합니다. 아이와 디자이너의 안전을 생각하고 보다 원활한 서비스를 위하여 아래의 내용을 숙지해 주시기 바랍니다.
              </p>
            </div>

            <section>
              <h2 className="flex items-center gap-2 font-bold text-mimi-charcoal mb-4">
                <span className="w-8 h-8 rounded-full bg-mimi-primary/20 text-mimi-primary flex items-center justify-center text-sm">!</span>
                서비스가 어려운 아이
              </h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✔</span>
                  <span>입마개를 해도 심하게 싫어하거나 무는 아이</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✔</span>
                  <span>노령견 (지병이 있는 아이)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✔</span>
                  <span>진드기, 벼룩, 피부병 등이 심한 아이</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">✔</span>
                  <span>생후 3개월 이하 아이</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="flex items-center gap-2 font-bold text-mimi-charcoal mb-4">
                <span className="w-8 h-8 rounded-full bg-mimi-primary/20 text-mimi-primary flex items-center justify-center text-sm">!</span>
                고객 유의사항
              </h2>
              <ul className="space-y-3 text-mimi-charcoal leading-relaxed">
                <li>서비스를 진행할 장소를 미리 결정하고, 서비스 전에 물기를 모두 제거해 주세요. (욕실, 베란다 등)</li>
                <li>미미살롱펫은 디자이너가 찾아가는 서비스입니다.</li>
                <li>때문에 앞뒤 예약과 이동시간 등의 변수로 인해 부득이 예약 시간을 조정해야 할 수도 있습니다.</li>
                <li>이 경우 디자이너가 사전에 미리 연락을 드립니다.</li>
              </ul>
            </section>

            <p className="text-sm text-mimi-slate">
              상세 내용은 <Link href="/terms" className="text-mimi-primary hover:underline font-medium">고객약관</Link>에서 확인하세요.
            </p>
            <div className="pt-4">
              <Link href="/booking" className="btn-primary block text-center w-full">
                예약하기
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
