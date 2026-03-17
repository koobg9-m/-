"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { getTipBySlug } from "@/lib/tips-notices-storage";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

export default function TipDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [tip, setTip] = useState(() => (slug ? getTipBySlug(slug) : null));

  useEffect(() => {
    const refresh = () => setTip(slug ? getTipBySlug(slug) : null);
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("mimi_tips_notices_updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("mimi_tips_notices_updated", refresh);
    };
  }, [slug]);

  if (!tip) {
    return (
      <div className="min-h-screen flex flex-col bg-mimi-cream">
        <Header />
        <main className="flex-1">
          <div className="max-w-2xl mx-auto px-4 py-12">
            <Link href="/tips" className="text-mimi-primary hover:underline">← 육아 노하우로</Link>
            <p className="mt-4 text-mimi-slate">내용을 찾을 수 없습니다.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link href="/tips" className="text-mimi-primary hover:text-mimi-primaryDark transition-colors mb-4 inline-block">← 육아 노하우로</Link>
          <h1 className="text-2xl font-bold text-mimi-charcoal mb-8">{tip.title}</h1>

          <div className="card p-6 md:p-8 bg-white">
            <p className="text-mimi-charcoal leading-relaxed">
              {tip.content}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
