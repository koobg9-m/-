"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SERVICE_DEFS, getServicePrice, hydrateServicesFromRemote } from "@/lib/services";
import type { BreedType, WeightTier } from "@/lib/services";

const BREED_SAMPLES: { breed: BreedType; tier: WeightTier }[] = [
  { breed: "소형견", tier: "5kg미만" },
  { breed: "중형견", tier: "9kg미만" },
  { breed: "특수견", tier: "9kg미만" },
];

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

export default function ServicesPage() {
  const [, setSynced] = useState(0);
  useEffect(() => {
    void hydrateServicesFromRemote().then(() => setSynced((n) => n + 1));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">서비스 가격표 (강아지)</h1>
          <p className="text-gray-600 text-lg mb-4">디자이너 · 시간 · 서비스 항목을 선택하여 예약하세요</p>
          <Link href="/pricing" className="inline-block px-6 py-2 bg-mimi-yellow/30 text-mimi-orange rounded-full font-medium hover:bg-mimi-yellow/50 transition-colors">
            📋 상세 요금 안내 (소형견·중형견·특수견)
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {SERVICE_DEFS.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl p-8 shadow-lg border-2 border-gray-100 transition-all hover:shadow-xl"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-mimi-blue to-mimi-blue/80 flex items-center justify-center text-3xl mb-6">
                ✂️
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{service.name}</h2>
              <p className="text-gray-600 mb-4">{service.description}</p>
              <ul className="text-sm text-gray-500 space-y-1 mb-4">
                <li>· 예상 소요: {service.duration}분</li>
              </ul>
              <div className="space-y-1 text-sm">
                {BREED_SAMPLES.filter(({ breed }) => (service.forBreed as readonly BreedType[]).includes(breed)).map(({ breed, tier }) => {
                  const price = getServicePrice(service.id, breed, tier);
                  if (!price) return null;
                  return (
                    <p key={breed} className="text-gray-600">{breed} {tier} <span className="font-bold text-mimi-orange">{price.toLocaleString()}원</span>~</p>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-mimi-yellow/20 rounded-2xl">
          <h3 className="text-xl font-bold text-gray-800 mb-4">서비스 이용 안내</h3>
          <ul className="space-y-2 text-gray-600">
            <li>· 전문 그루머가 고객님 댁으로 방문합니다</li>
            <li>· 강아지 전용 서비스입니다</li>
            <li>· 예약 전 상담 가능합니다</li>
            <li>· <Link href="/pricing" className="text-mimi-orange hover:underline font-medium">상세 요금표</Link>에서 소형견·중형견·특수견별 가격, 추가요금, 취소환불 규정을 확인하세요</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-mimi-orange hover:underline">← 홈으로</Link>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
