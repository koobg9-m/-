"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams, notFound } from "next/navigation";
import { getServiceDef, getServicePrice } from "@/lib/services";
import type { BreedType, WeightTier } from "@/lib/services";

const BREED_SAMPLES: { breed: BreedType; tier: WeightTier }[] = [
  { breed: "소형견", tier: "5kg미만" },
  { breed: "중형견", tier: "9kg미만" },
  { breed: "특수견", tier: "9kg미만" },
];

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

export default function ServiceDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const service = getServiceDef(id);
  if (!service) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-12 w-full">
        <Link href="/services" className="text-mimi-orange hover:underline mb-6 inline-block">← 서비스 목록</Link>

        <div className="rounded-2xl p-8 shadow-lg border-2 border-gray-100">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-mimi-blue to-mimi-blue/80 flex items-center justify-center text-4xl mb-6">
            ✂️
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{service.name}</h1>
          <p className="text-gray-600 text-lg mb-6">{service.description}</p>

          <div className="space-y-3">
            <p><span className="text-gray-500">예상 소요 시간</span> {service.duration}분</p>
            <div>
              <p className="text-gray-500 mb-2">견종·체중별 가격 (강아지)</p>
              <div className="space-y-1">
                {BREED_SAMPLES.filter(({ breed }) => (service.forBreed as readonly BreedType[]).includes(breed)).map(({ breed, tier }) => {
                  const price = getServicePrice(service.id, breed, tier);
                  if (!price) return null;
                  return (
                    <p key={breed}>{breed} {tier} <span className="font-bold text-mimi-orange">{price.toLocaleString()}원</span>~</p>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
