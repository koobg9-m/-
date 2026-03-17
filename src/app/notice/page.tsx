"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getNotices } from "@/lib/tips-notices-storage";
import type { NoticeItem } from "@/lib/tips-notices-storage";

const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });

function NoticeCard({ item }: { item: NoticeItem }) {
  const baseClass = "block p-4 rounded-xl border border-stone-200 bg-white hover:border-mimi-primary/30 hover:shadow-md transition-all";
  const header = (
    <div className="flex items-center justify-between gap-4">
      <div>
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${item.type === "공지" ? "bg-mimi-primary/10 text-mimi-primary" : "bg-mimi-accent/10 text-mimi-accent"}`}>
          {item.type}
        </span>
        <span className="font-medium text-mimi-charcoal">{item.title}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm text-mimi-slate">{item.date}</span>
        {item.url && <span className="text-mimi-primary">→</span>}
      </div>
    </div>
  );
  const body = item.content ? (
    <p className="text-mimi-slate text-sm mt-3 leading-relaxed">{item.content}</p>
  ) : item.url ? (
    <p className="text-sm text-mimi-slate mt-1">자세히 보기</p>
  ) : null;

  const content = (
    <>
      {header}
      {body}
    </>
  );

  if (item.url) {
    return (
      <Link href={item.url} target="_blank" rel="noopener noreferrer" className={baseClass}>
        {content}
      </Link>
    );
  }
  return <div className={baseClass}>{content}</div>;
}

export default function NoticePage() {
  const [notices, setNotices] = useState(() => getNotices());

  useEffect(() => {
    const refresh = () => setNotices(getNotices());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("mimi_tips_notices_updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("mimi_tips_notices_updated", refresh);
    };
  }, []);

  const pinned = notices.filter((n) => n.pinned);
  const recent = notices.filter((n) => !n.pinned);

  return (
    <div className="min-h-screen flex flex-col bg-mimi-cream">
      <Header />
      <main className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link href="/" className="text-mimi-primary hover:text-mimi-primaryDark transition-colors mb-4 inline-block">← 홈으로</Link>
          <h1 className="text-2xl font-bold text-mimi-charcoal mb-8">공지 & 이벤트</h1>

          {pinned.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">📌 고정 공지</h2>
              <div className="space-y-3">
                {pinned.map((item) => (
                  <NoticeCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-mimi-charcoal mb-4">📋 최근 공지</h2>
              <div className="space-y-3">
                {recent.map((item) => (
                  <NoticeCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {notices.length === 0 && (
            <p className="text-mimi-slate">등록된 공지가 없습니다.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
