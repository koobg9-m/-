"use client";

import Link from "next/link";
import { SERVICE_DEFS } from "@/lib/services";

export default function ServiceMenu() {
  return (
    <section className="py-10 bg-white">
      <div className="page-container max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-mimi-charcoal">서비스 안내</h2>
          <p className="text-sm text-mimi-slate mt-1 mb-3">
            디자이너 · 시간 · 서비스 항목을 선택하여 예약하세요
          </p>
          <Link href="/pricing" prefetch={false} className="inline-flex items-center gap-1 px-3 py-1.5 bg-mimi-accent/10 text-mimi-accent rounded-lg text-xs font-medium hover:bg-mimi-accent/20 transition-colors">
            📋 상세 요금 안내
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SERVICE_DEFS.map((service) => (
            <div key={service.id} className="card card-hover p-3">
              <div className="w-8 h-8 rounded-lg bg-mimi-primary/10 flex items-center justify-center text-base mb-2">
                ✂️
              </div>
              <h3 className="text-sm font-bold text-mimi-charcoal mb-0.5 leading-tight">{service.name}</h3>
              <p className="text-xs text-mimi-slate line-clamp-2">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
