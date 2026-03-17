"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link href="/" className="text-mimi-primary hover:text-mimi-primaryDark transition-colors mb-4 inline-block">← 홈으로</Link>
          <h1 className="text-2xl font-bold text-mimi-charcoal mb-8">미미살롱펫 고객약관</h1>

          <div className="card p-6 md:p-8 bg-white space-y-8">
            {/* 미용전 안내사항 */}
            <section>
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">미용전 안내사항</h2>
              <p className="text-mimi-charcoal mb-4">요금은 출장비 포함이며 별도의 시간추가에 대한 비용은 없습니다.</p>
            </section>

            {/* 예약전 안내 */}
            <section>
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">예약전 안내</h2>
              <p className="text-mimi-charcoal leading-relaxed mb-4">
                미미살롱펫 - 안심출장미용은 고객에게 소중한 미미살롱펫에게도 소중한 반려견/반려묘의 만족스런 미용을 위해 최선을 다합니다. 아이와 디자이너의 안전을 염두에 두시고 원활한 서비스를 위해 함께 협조를 기대합니다.
              </p>

              <h3 className="font-bold text-mimi-charcoal mt-6 mb-2">1) 고객의 준비사항</h3>
              <ul className="space-y-2 text-mimi-charcoal text-sm">
                <li><strong>샴푸</strong> — 샴푸가 바뀌어서 일어날 문제의 예방차원입니다.</li>
                <li><strong>가정용드라이어기</strong> — 소리로 인한 스트레스를 최소화하고자 합니다.</li>
                <li><strong>미용할 장소</strong> — 아이와 디자이너가 안전하고 최대로 편한 장소를 마련해 주세요. 욕실의 경우 사전에 물기를 제거해 주세요.</li>
              </ul>

              <h3 className="font-bold text-mimi-charcoal mt-6 mb-2">2) 유의사항</h3>
              <ul className="space-y-2 text-mimi-charcoal text-sm list-disc list-inside">
                <li>사나움으로 인한 미용의 어려움, 털엉킴이나 체중초과로 인한 추가요금이 발생할 수도 있습니다.</li>
                <li>지병/노령견/미용을 심하게 싫어하는 아이/진드기·벼룩 등 피부병이 심한 아이/생후 3개월 이하 및 예방접종을 다 마치지 못한 아이는 미용을 진행하지 못할 수도 있습니다. (사전에 협의해 주세요)</li>
                <li>미용 소요시간은 샵을 기준으로 30분 내외 더 소요될 수 있습니다.</li>
                <li>미용 중 아이의 상태에 따라 미용을 중단 시 고객님이 지급한 금액 중 일부 혹은 전부를 환불하지 않을 수도 있습니다.</li>
              </ul>

              <h3 className="font-bold text-mimi-charcoal mt-6 mb-2">3) 방문 디자이너에 대한</h3>
              <ul className="space-y-2 text-mimi-charcoal text-sm list-disc list-inside">
                <li>디자이너가 찾아가는 서비스인 미미살롱펫은 이동시간 등 디자이너의 사유로 부득이하게 예약시간이 정확하지 않을 수도 있습니다.</li>
                <li>방문하는 디자이너는 당사의 가족이며 고객님의 아이를 위해 최선을 다하려고 합니다. 아이의 편안한 미용을 위해 최대한 협조를 당부드리며, 아이의 편안한 미용을 위해 필요 시 요청사항이 있을 수 있습니다.</li>
                <li>혹 디자이너의 미용 시 미용 외적으로 미용에 방해가 된다고 판단되는 경우 디자이너는 미용을 즉시 중단할 수 있습니다. 이의 경우 당사는 미용비의 전액을 환불하지 않을 수도 있습니다. 또한 사안에 따라 적절한 법적 조치도 가능할 수 있습니다. (예시: 신상에 대한 험한 행동이나 성희롱 등 기타 미용을 계속하기 어렵다고 판단되는 경우)</li>
              </ul>

              <h3 className="font-bold text-mimi-charcoal mt-6 mb-2">4) 개별 연락에 대한</h3>
              <p className="text-mimi-charcoal text-sm">
                해당 디자이너는 미미살롱펫 소속으로의 책임감을 갖고 있으며, 만약 개별적으로 연락을 하셔서 미용 중 사고 등 다양한 사고가 발생할 경우 당사의 책임은 없습니다. 미미살롱펫은 미용 중 디자이너의 고의·과실에 의한 사고에 대해서만 책임을 집니다.
              </p>
            </section>

            {/* 서비스후 안내 */}
            <section>
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">서비스후 안내</h2>
              <p className="text-mimi-charcoal text-sm leading-relaxed">
                디자이너가 서비스 전후 아이의 사진을 찍게 됩니다. 아이 사진에 대한 초상권이나 저작권 등에 대한 권리는 고객님의 허락으로 미미살롱펫에 있음을 확인합니다. 아이의 미용 및 건강관리를 위한 것이니 최대한 협조 바랍니다. 서비스 만족도를 평가해 주시면 더 좋은 서비스를 하는 데 도움이 됩니다. 만족하실 경우 주변에 추천해 주시면 추천받는 아이는 혜택을 받게 됩니다.
              </p>
            </section>

            {/* 미용 및 사고시 */}
            <section>
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">미용 및 사고시</h2>
              <p className="text-mimi-charcoal text-sm leading-relaxed">
                미용 중 간혹 스크래치 등 가벼운 상처가 날 수도 있습니다. 경미한 경우 견주께서는 이를 인정해 주셔야 합니다. 미용을 좋아하는 아이는 없습니다. 만약 사고가 나면 미미살롱펫이 책임감을 갖고 적극적인 사고 대처를 하도록 하겠습니다. 또한 디자이너가 미용 전/중/후 서비스 내용에 문제가 있을 경우 당사에 적극 의견을 개진해 주시길 바랍니다.
              </p>
            </section>

            {/* 환불기준 */}
            <section>
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">환불기준</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse border border-stone-200">
                  <thead>
                    <tr className="bg-stone-50">
                      <th className="border border-stone-200 px-3 py-2 text-left">환불기준</th>
                      <th className="border border-stone-200 px-3 py-2 text-left">환불내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border border-stone-200 px-3 py-2">24시간 이내 취소 시</td><td className="border border-stone-200 px-3 py-2">90%</td></tr>
                    <tr><td className="border border-stone-200 px-3 py-2">전혀 손도 못 대고 나올 경우</td><td className="border border-stone-200 px-3 py-2">70%</td></tr>
                    <tr><td className="border border-stone-200 px-3 py-2">미용 중 서비스 중단</td><td className="border border-stone-200 px-3 py-2">최대 50%</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 지병있는 아이 및 노령견 미용 동의서 */}
            <section className="p-4 bg-amber-50 rounded-xl border border-amber-200/60">
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">지병있는 아이 및 노령견 미용 동의서</h2>
              <p className="text-mimi-charcoal text-sm leading-relaxed mb-4">
                미미살롱펫은 애견미용을 의뢰하신 반려견/반려묘를 미용하는 데 있어 노령견임을 감안하여 최대한 주의해서 미용할 것을 약속드립니다. 단, 노환으로 인한 각종 질병이 있어 미용 후 지병의 악화나 스트레스로 원치 않은 상황이 발생할 수 있음을 미리 알려 드립니다. 이에 미미살롱펫은 최대한 아이들을 배려하는 마음으로 미용할 것을 약속드리지만, 이로 인해 발생하는 상황에 대해서는 견주가 미미살롱펫에 책임을 묻지 않을 것에 대한 동의 후 미용을 할 것을 알려 드립니다. 본 동의서는 견주와 당사의 합의하에 한 번의 서명함을 확인합니다.
              </p>
            </section>

            {/* 사업자 정보 */}
            <section className="pt-4 border-t border-stone-200">
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">사업자 정보</h2>
              <ul className="text-mimi-charcoal text-sm space-y-1">
                <li>주소: 65-1, Sadang-ro, Dongjak-gu, Seoul, Korea (서울시 동작구 사당로 65-1)</li>
                <li>사업자등록번호: 828-87-000919</li>
                <li>통신판매업신고: 2023-서울동작-0405</li>
                <li>대표: 구본기</li>
                <li>개인정보관리책임자: 구본기</li>
                <li>연락처: 070-7651-9568</li>
                <li>제휴·문의: koobg@naver.com</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
