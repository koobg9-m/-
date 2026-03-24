"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "예약은 어떻게 하나요?",
    a: "홈페이지 상단의 「예약하기」에서 로그인 후 서비스·일시·디자이너를 선택해 주세요. 예약이 접수되면 디자이너가 확인·확정 연락을 드립니다. 예약 전에는 「예약전 안내」와 요금표를 꼭 확인해 주세요.",
  },
  {
    q: "예약을 변경하거나 취소할 수 있나요?",
    a: "마이페이지 「예약 내역」에서 결제완료·예약확정 상태인 건은 고객이 직접 취소할 수 있습니다. 취소 전 상세 내용을 확인하는 절차가 있습니다. 환불 비율은 상세 요금표의 취소·환불 규정을 따릅니다. 서비스가 완료된 예약은 취소할 수 없습니다.",
  },
  {
    q: "결제는 언제·어떻게 이루어지나요?",
    a: "예약 확정 흐름에 따라 안내되는 금액 기준으로 결제가 이루어집니다. 포인트 사용·추가 요금(엉킴, 스타일 컷 등)은 예약 시 선택한 항목에 따라 달라질 수 있습니다.",
  },
  {
    q: "디자이너 방문 전 집에서 준비할 것이 있나요?",
    a: "미용을 진행할 공간(욕실·베란다 등)을 미리 정해 주시고, 서비스 전 물기를 제거해 주시면 원활합니다. 아이 성향·건강 상태는 예약 시 꼭 알려 주세요. 자세한 내용은 「예약전 안내」를 참고해 주세요.",
  },
  {
    q: "미용 시간은 얼마나 걸리나요?",
    a: "견종·체중·선택 서비스에 따라 달라집니다. 디자이너가 예약 확정 시 대략적인 소요 시간을 안내해 드릴 수 있습니다.",
  },
  {
    q: "추가 요금이 붙을 수 있나요?",
    a: "스타일 얼굴컷, 엉킴, 지병 케어 등 추가 항목을 선택하시면 요금표에 따라 추가 요금이 적용될 수 있습니다. 예약 화면에서 항목별 금액을 확인할 수 있습니다.",
  },
  {
    q: "불편하거나 문의가 있을 때는 어디로 연락하나요?",
    a: "긴급한 예약·서비스 문의는 하단의 예약문의 전화로 연락해 주시고, 제휴·기타 문의는 이메일로 보내 주시면 됩니다. 자주 묻는 내용은 이 페이지(Q&A)와 공지·요금 안내를 함께 확인해 주세요.",
  },
  {
    q: "디자이너(그루머) 지원은 어떻게 하나요?",
    a: "푸터의 「디자이너 신청하기」에서 가입 절차를 안내합니다. 디자이너 전용 페이지에서 일정·예약 관리도 하실 수 있습니다.",
  },
];

export default function QnaPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-amber-50/40 via-mimi-cream to-white">
      <Header />
      <main className="flex-1">
        <div className="page-container py-8 md:py-12 max-w-3xl mx-auto px-4">
          <Link href="/" prefetch={false} className="text-mimi-primary hover:text-mimi-primaryDark transition-colors mb-4 inline-block text-sm font-medium">
            ← 홈으로
          </Link>

          <div className="rounded-2xl bg-gradient-to-br from-mimi-orange/10 to-amber-100/50 border border-mimi-orange/20 p-6 md:p-8 mb-8 shadow-sm">
            <p className="text-sm font-semibold text-mimi-orange uppercase tracking-wide mb-1">Customer Q&amp;A</p>
            <h1 className="text-2xl md:text-3xl font-bold text-mimi-charcoal mb-2">자주 묻는 질문</h1>
            <p className="text-mimi-slate leading-relaxed">
              예약·결제·취소·방문 미용 등 고객 문의를 한곳에 모았습니다. 원하시는 항목을 눌러 답변을 확인해 주세요.
            </p>
          </div>

          <div className="space-y-3 mb-10">
            {FAQ_ITEMS.map((item, i) => {
              const open = openIndex === i;
              return (
                <div
                  key={i}
                  className={`rounded-xl border transition-all duration-200 ${
                    open ? "border-mimi-orange/40 bg-white shadow-md ring-1 ring-mimi-orange/10" : "border-stone-200 bg-white/80 hover:border-stone-300"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="w-full flex items-start justify-between gap-4 text-left px-4 py-4 md:px-5 md:py-4"
                    aria-expanded={open}
                  >
                    <span className="font-bold text-mimi-charcoal pr-2">
                      <span className="text-mimi-orange mr-2">Q.</span>
                      {item.q}
                    </span>
                    <span className={`shrink-0 text-mimi-orange text-lg transition-transform ${open ? "rotate-180" : ""}`} aria-hidden>
                      ▼
                    </span>
                  </button>
                  {open && (
                    <div className="px-4 pb-4 md:px-5 md:pb-5 pt-0 border-t border-stone-100">
                      <p className="text-sm md:text-[15px] text-mimi-slate leading-relaxed pl-0 md:pl-1 pt-3">
                        <span className="font-semibold text-mimi-charcoal mr-2">A.</span>
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="card p-6 md:p-8 bg-mimi-charcoal text-stone-100 border-0 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl" aria-hidden>
                📞
              </span>
              그래도 궁금하신가요?
            </h2>
            <p className="text-stone-300 text-sm mb-6 leading-relaxed">
              전화·이메일로 문의해 주시면 예약·서비스 관련 안내를 도와드립니다.
            </p>
            <ul className="space-y-3 text-sm">
              <li>
                <span className="text-stone-400 block text-xs mb-0.5">예약문의</span>
                <a href="tel:010-4546-2955" className="text-mimi-gold font-bold text-lg hover:underline">
                  010-4546-2955
                </a>
              </li>
              <li>
                <span className="text-stone-400 block text-xs mb-0.5">이메일</span>
                <a href="mailto:koobg@naver.com" className="text-white hover:text-mimi-gold underline underline-offset-2">
                  koobg@naver.com
                </a>
              </li>
            </ul>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link href="/booking" prefetch={false} className="btn-primary text-center py-3 px-6">
                예약하기
              </Link>
              <Link
                href="/pricing"
                prefetch={false}
                className="text-center py-3 px-6 rounded-xl border border-stone-500 text-stone-200 hover:bg-white/10 transition-colors font-medium"
              >
                요금·환불 안내
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
