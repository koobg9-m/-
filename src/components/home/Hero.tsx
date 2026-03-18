"use client";

import Link from "next/link";
import { useState } from "react";

export default function Hero() {
  const [mainLogoError, setMainLogoError] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-stone-50 via-mimi-cream to-amber-50/40 py-10 md:py-14">
      {/* 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-mimi-primary/5 blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-mimi-accent/5 blur-2xl" />
        <div className="absolute top-1/4 left-1/4 text-5xl opacity-[0.04]">🐕</div>
        <div className="absolute bottom-1/4 right-1/4 text-4xl opacity-[0.04]">✨</div>
      </div>

      <div className="page-container relative z-10 overflow-x-hidden">
        <div className="text-center max-w-xl mx-auto">
          {/* 노란색 메인 로고 (50% 확대) */}
          <div className="mb-6 flex justify-center items-center">
            <div className="aspect-square w-[180px] h-[180px] sm:w-[240px] sm:h-[240px] md:w-[330px] md:h-[330px] rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(30,45,45,0.12)] flex items-center justify-center shrink-0 bg-mimi-creamBg">
              {mainLogoError ? (
                <img src="/hero-dog.svg" alt="mimi SALON Pet" width={120} height={120} className="object-contain opacity-90" />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src="/logo-main.png" alt="mimi SALON Pet" width={220} height={220} className="w-full h-full object-contain" onError={() => setMainLogoError(true)} />
              )}
            </div>
          </div>
          <p className="text-sm text-mimi-slate mb-2 leading-relaxed max-w-md mx-auto">
            전문 그루머가 우리 집으로 찾아와요. 강아지를 위한 편안한 미용 경험을 제공합니다.
          </p>
          <p className="text-sm md:text-base font-brand font-semibold tracking-[0.08em] text-mimi-primary mb-6">세계 1등!! 안심방문 미용서비스 미미살롱펫 since 2017.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/booking" className="btn-primary text-sm py-2.5 px-6">
              지금 예약하기
            </Link>
            <Link href="/services" className="btn-secondary text-sm py-2.5 px-6">
              서비스 보기
            </Link>
          </div>
          <p className="mt-4 text-xs text-mimi-slate space-x-4">
            <Link href="/pricing" className="text-mimi-primary hover:text-mimi-primaryDark font-medium transition-colors inline-flex items-center gap-1">
              <span>📋</span> 상세 요금표 보기
            </Link>
            <Link href="/groomer/register" className="text-mimi-primary hover:text-mimi-primaryDark font-medium transition-colors inline-flex items-center gap-1">
              <span>✂️</span> 디자이너 신청하기
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
