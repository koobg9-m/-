"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { getAdditionalFees, getAdditionalFeePrice } from "@/lib/services";
import type { BreedType } from "@/lib/services";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

function AdditionalFeesSection({ breedType }: { breedType: BreedType }) {
  const fees = getAdditionalFees();
  return (
    <div className="mt-4 p-4 bg-mimi-primary/5 rounded-xl border border-mimi-primary/20 text-sm">
      <p className="font-medium text-mimi-primary mb-2">추가사항 (추가요금)</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-stone-50/80">
              <th className="border border-stone-200 px-3 py-2 text-left font-medium">항목</th>
              <th className="border border-stone-200 px-3 py-2 text-center font-medium">가격</th>
              <th className="border border-stone-200 px-3 py-2 text-left font-medium">설명</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) => (
              <tr key={f.id} className="border-b border-stone-100">
                <td className="border border-stone-200 px-3 py-2">{f.name}</td>
                <td className="border border-stone-200 px-3 py-2 text-center font-bold text-mimi-primary">
                  {getAdditionalFeePrice(f, breedType).toLocaleString()}원
                </td>
                <td className="border border-stone-200 px-3 py-2 text-mimi-slate">{f.description ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-mimi-slate mt-2 text-xs">* 미용시 확인 후 모량에 따라 기장, 모량, 이중모 추가금 발생</p>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/" className="text-mimi-primary hover:text-mimi-primaryDark transition-colors mb-4 inline-block">← 홈으로</Link>
            <h1 className="text-3xl font-bold text-mimi-charcoal mb-2">미용 요금표</h1>
            <p className="text-mimi-slate mb-8">체중·견종별 상세 요금 및 이용 안내</p>

          {/* 소형견 */}
          <section className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-mimi-charcoal mb-2">소형견</h2>
            <p className="text-sm text-mimi-slate mb-4">토이푸들, 포메, 말티즈, 시츄, 요크셔, 치와와, 닥스훈트, 미니핀, 파피용 등</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50">
                    <th className="border border-stone-200 px-3 py-2 text-left">체중</th>
                    <th className="border border-stone-200 px-3 py-2">목욕+위생미용</th>
                    <th className="border border-stone-200 px-3 py-2">위생+목욕+얼굴컷</th>
                    <th className="border border-stone-200 px-3 py-2">전체클리핑(올빡)</th>
                    <th className="border border-stone-200 px-3 py-2">전체클리핑+얼굴컷</th>
                    <th className="border border-stone-200 px-3 py-2">몸클리핑+가위컷</th>
                    <th className="border border-stone-200 px-3 py-2">전체가위컷</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border px-3 py-2">3kg미만</td><td className="border px-3 py-2 text-center">45,000</td><td className="border px-3 py-2 text-center">55,000</td><td className="border px-3 py-2 text-center">55,000</td><td className="border px-3 py-2 text-center">60,000</td><td className="border px-3 py-2 text-center">80,000</td><td className="border px-3 py-2 text-center">95,000</td></tr>
                  <tr><td className="border px-3 py-2">5kg미만</td><td className="border px-3 py-2 text-center">50,000</td><td className="border px-3 py-2 text-center">60,000</td><td className="border px-3 py-2 text-center">60,000</td><td className="border px-3 py-2 text-center">65,000</td><td className="border px-3 py-2 text-center">85,000</td><td className="border px-3 py-2 text-center">100,000</td></tr>
                  <tr><td className="border px-3 py-2">7kg미만</td><td className="border px-3 py-2 text-center">55,000</td><td className="border px-3 py-2 text-center">70,000</td><td className="border px-3 py-2 text-center">70,000</td><td className="border px-3 py-2 text-center">75,000</td><td className="border px-3 py-2 text-center">95,000</td><td className="border px-3 py-2 text-center">110,000</td></tr>
                  <tr><td className="border px-3 py-2">9kg미만</td><td className="border px-3 py-2 text-center">60,000</td><td className="border px-3 py-2 text-center">80,000</td><td className="border px-3 py-2 text-center">80,000</td><td className="border px-3 py-2 text-center">85,000</td><td className="border px-3 py-2 text-center">105,000</td><td className="border px-3 py-2 text-center">120,000</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-mimi-slate mt-2">* 9kg 이상은 중형견에 속합니다.</p>
            <AdditionalFeesSection breedType="소형견" />
          </section>

          {/* 중형견 */}
          <section className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-mimi-charcoal mb-2">중형견</h2>
            <p className="text-sm text-mimi-slate mb-4">미니어처푸들, 스피츠, 코카스파니엘, 슈나우져, 비글, 프렌치블독 등</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50">
                    <th className="border border-stone-200 px-3 py-2 text-left">체중</th>
                    <th className="border border-stone-200 px-3 py-2">위생+목욕+얼굴컷</th>
                    <th className="border border-stone-200 px-3 py-2">전체클리핑(올빡)</th>
                    <th className="border border-stone-200 px-3 py-2">전체클리핑+얼굴컷</th>
                    <th className="border border-stone-200 px-3 py-2">몸클리핑+가위컷</th>
                    <th className="border border-stone-200 px-3 py-2">전체가위컷</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border px-3 py-2">3kg미만</td><td className="border px-3 py-2 text-center">45,000</td><td className="border px-3 py-2 text-center">60,000</td><td className="border px-3 py-2 text-center">60,000</td><td className="border px-3 py-2 text-center">65,000</td><td className="border px-3 py-2 text-center">85,000</td><td className="border px-3 py-2 text-center">100,000</td></tr>
                  <tr><td className="border px-3 py-2">5kg미만</td><td className="border px-3 py-2 text-center">50,000</td><td className="border px-3 py-2 text-center">65,000</td><td className="border px-3 py-2 text-center">65,000</td><td className="border px-3 py-2 text-center">70,000</td><td className="border px-3 py-2 text-center">90,000</td><td className="border px-3 py-2 text-center">105,000</td></tr>
                  <tr><td className="border px-3 py-2">7kg미만</td><td className="border px-3 py-2 text-center">55,000</td><td className="border px-3 py-2 text-center">75,000</td><td className="border px-3 py-2 text-center">75,000</td><td className="border px-3 py-2 text-center">80,000</td><td className="border px-3 py-2 text-center">100,000</td><td className="border px-3 py-2 text-center">115,000</td></tr>
                  <tr><td className="border px-3 py-2">9kg미만</td><td className="border px-3 py-2 text-center">60,000</td><td className="border px-3 py-2 text-center">85,000</td><td className="border px-3 py-2 text-center">85,000</td><td className="border px-3 py-2 text-center">90,000</td><td className="border px-3 py-2 text-center">110,000</td><td className="border px-3 py-2 text-center">125,000</td></tr>
                  <tr><td className="border px-3 py-2">11kg미만</td><td className="border px-3 py-2 text-center">65,000</td><td className="border px-3 py-2 text-center">95,000</td><td className="border px-3 py-2 text-center">95,000</td><td className="border px-3 py-2 text-center">100,000</td><td className="border px-3 py-2 text-center">120,000</td><td className="border px-3 py-2 text-center">135,000</td></tr>
                  <tr><td className="border px-3 py-2">13kg미만</td><td className="border px-3 py-2 text-center">70,000</td><td className="border px-3 py-2 text-center">105,000</td><td className="border px-3 py-2 text-center">105,000</td><td className="border px-3 py-2 text-center">110,000</td><td className="border px-3 py-2 text-center">130,000</td><td className="border px-3 py-2 text-center">145,000</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-mimi-slate mt-2">* 13kg 이상은 대형견에 속합니다.</p>
            <AdditionalFeesSection breedType="중형견" />
          </section>

          {/* 특수견 */}
          <section className="card p-6 mb-8">
            <h2 className="text-xl font-bold text-mimi-charcoal mb-2">특수견</h2>
            <p className="text-sm text-mimi-slate mb-4">비숑, 꼬똥드툴레아, 웰시코기, 테리어종류 등</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50">
                    <th className="border border-stone-200 px-3 py-2 text-left">체중</th>
                    <th className="border border-stone-200 px-3 py-2">위생+목욕+얼굴컷</th>
                    <th className="border border-stone-200 px-3 py-2">전체클리핑(올빡)</th>
                    <th className="border border-stone-200 px-3 py-2">전체클리핑+얼굴컷</th>
                    <th className="border border-stone-200 px-3 py-2">몸클리핑+가위컷</th>
                    <th className="border border-stone-200 px-3 py-2">전체가위컷</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td className="border px-3 py-2">3kg미만</td><td className="border px-3 py-2 text-center">45,000</td><td className="border px-3 py-2 text-center">60,000</td><td className="border px-3 py-2 text-center">60,000</td><td className="border px-3 py-2 text-center">65,000</td><td className="border px-3 py-2 text-center">100,000</td><td className="border px-3 py-2 text-center">115,000</td></tr>
                  <tr><td className="border px-3 py-2">5kg미만</td><td className="border px-3 py-2 text-center">50,000</td><td className="border px-3 py-2 text-center">65,000</td><td className="border px-3 py-2 text-center">65,000</td><td className="border px-3 py-2 text-center">70,000</td><td className="border px-3 py-2 text-center">110,000</td><td className="border px-3 py-2 text-center">125,000</td></tr>
                  <tr><td className="border px-3 py-2">7kg미만</td><td className="border px-3 py-2 text-center">55,000</td><td className="border px-3 py-2 text-center">75,000</td><td className="border px-3 py-2 text-center">75,000</td><td className="border px-3 py-2 text-center">80,000</td><td className="border px-3 py-2 text-center">120,000</td><td className="border px-3 py-2 text-center">135,000</td></tr>
                  <tr><td className="border px-3 py-2">9kg미만</td><td className="border px-3 py-2 text-center">60,000</td><td className="border px-3 py-2 text-center">85,000</td><td className="border px-3 py-2 text-center">85,000</td><td className="border px-3 py-2 text-center">90,000</td><td className="border px-3 py-2 text-center">130,000</td><td className="border px-3 py-2 text-center">145,000</td></tr>
                  <tr><td className="border px-3 py-2">11kg미만</td><td className="border px-3 py-2 text-center">65,000</td><td className="border px-3 py-2 text-center">95,000</td><td className="border px-3 py-2 text-center">95,000</td><td className="border px-3 py-2 text-center">100,000</td><td className="border px-3 py-2 text-center">140,000</td><td className="border px-3 py-2 text-center">155,000</td></tr>
                  <tr><td className="border px-3 py-2">13kg미만</td><td className="border px-3 py-2 text-center">65,000</td><td className="border px-3 py-2 text-center">105,000</td><td className="border px-3 py-2 text-center">105,000</td><td className="border px-3 py-2 text-center">110,000</td><td className="border px-3 py-2 text-center">150,000</td><td className="border px-3 py-2 text-center">165,000</td></tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-mimi-slate mt-2">* 15kg 이상은 대형견입니다.</p>
            <AdditionalFeesSection breedType="특수견" />
          </section>

          {/* 취소 환불 규정 */}
          <section className="card p-6 mb-8 bg-mimi-primary/5 border-mimi-primary/20">
            <h2 className="text-xl font-bold text-mimi-charcoal mb-4">예약 후 취소 환불 규정</h2>
            <ul className="space-y-2 text-mimi-charcoal">
              <li>· 3일 전 취소: 90% 환불</li>
              <li>· 1~2일 전 취소: 80% 환불</li>
              <li>· 당일 취소 또는 방문 시 부재중: 70% 환불</li>
              <li>· 방문 시 사나움이나 반려견 상태로 미용 불가 시: 50% 환불</li>
            </ul>
          </section>

          {/* 지병·노령견 동의서 안내 */}
          <section className="card p-6 mb-8 bg-stone-50/80">
            <h2 className="text-xl font-bold text-mimi-charcoal mb-4">지병·노령견 미용 안내</h2>
            <p className="text-mimi-charcoal mb-4">
              지병(뇌질환, 심장질환, 보행(stay)불가 등)이 있거나 노령견(10살 이상)인 경우에는 &quot;지병, 노령견 미용 동의서&quot;를 작성하여야 합니다.
            </p>
            <p className="text-sm text-mimi-slate mb-4">* 동의서 미작성 후 미용 시 작성한 것으로 간주합니다.</p>
            <div className="p-4 bg-white rounded-xl border border-stone-200 text-sm text-mimi-charcoal leading-relaxed">
              <h3 className="font-bold mb-3">[지병, 노령견 미용 동의서]</h3>
              <p className="mb-2">미미살롱펫은 애견미용을 의뢰한 반려견을 미용하는데 있어 소홀함이 없이 노령견임을 감안하여 최대한 주의해서 미용할 것을 약속 드립니다.</p>
              <p className="mb-2">단, 노령견일 경우 노환으로 인한 각종 질병이 있어 미용 후 지병의 악화나 스트레스로 원치 않은 상황이 발생할 수 있음을 미리 알려 드립니다.</p>
              <p className="mb-2">이에 미미살롱펫은 최대한 아이들을 배려하는 마음으로 미용할 것을 약속 드리지만, 이로 인해 발생하는 상황에 대해서는 견주가 미미살롱펫에 책임을 묻지 않을 것에 대한 동의 후 미용을 진행합니다.</p>
              <p>미용 동의서는 미용 의뢰 시마다 매번 작성하는 불편을 최소화하기 위해 견주와 당사의 합의하에 한 번의 서명으로 앞으로 서비스 이용에 동일한 내용이 적용됩니다.</p>
            </div>
          </section>

          <div className="text-center pt-4">
            <p className="text-mimi-slate">항상 최선을 다하는 미미살롱펫입니다. 🐾</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
