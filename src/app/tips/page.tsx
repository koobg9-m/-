"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getTips, hydrateTipsNoticesFromRemote, subscribeTipsNoticesRemote } from "@/lib/tips-notices-storage";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

export default function TipsPage() {
  const [tips, setTips] = useState(() => getTips());

  useEffect(() => {
    const refresh = () => setTips(getTips());
    let unsubRemote: (() => void) | undefined;
    (async () => {
      await hydrateTipsNoticesFromRemote();
      refresh();
      unsubRemote = subscribeTipsNoticesRemote(refresh);
    })();
    window.addEventListener("storage", refresh);
    window.addEventListener("mimi_tips_notices_updated", refresh);
    const onVisible = () => {
      void hydrateTipsNoticesFromRemote().finally(refresh);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsubRemote?.();
      window.removeEventListener("storage", refresh);
      window.removeEventListener("mimi_tips_notices_updated", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link href="/" className="text-mimi-primary hover:text-mimi-primaryDark transition-colors mb-4 inline-block">← 홈으로</Link>
          <h1 className="text-2xl font-bold text-mimi-charcoal mb-8">육아 노하우</h1>

          <div className="space-y-3">
            {tips.map((tip) => (
              <Link
                key={tip.id}
                href={`/tips/${tip.slug}`}
                className="block p-4 rounded-xl border border-stone-200 bg-white hover:border-mimi-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-mimi-charcoal">{tip.title}</span>
                  <span className="text-mimi-primary shrink-0">→</span>
                </div>
                <p className="text-sm text-mimi-slate mt-1">자세히 보기</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
