"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getNotices, hydrateTipsNoticesFromRemote, subscribeTipsNoticesRemote } from "@/lib/tips-notices-storage";
import type { NoticeItem } from "@/lib/tips-notices-storage";

const HOMEPAGE_NOTICES_KEY = "mimi_tips_notices_updated";

function NoticeItemCard({ item }: { item: NoticeItem }) {
  return (
    <div className="p-2 rounded-lg border border-stone-200 bg-white hover:border-mimi-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${item.type === "공지" ? "bg-mimi-primary/10 text-mimi-primary" : "bg-mimi-accent/10 text-mimi-accent"}`}>
          {item.type}
        </span>
        <span className="text-xs text-mimi-slate">{item.date}</span>
      </div>
      <p className="font-medium text-mimi-charcoal text-sm">{item.title}</p>
      {item.content && <p className="text-xs text-mimi-slate mt-0.5 line-clamp-1">{item.content}</p>}
    </div>
  );
}

export default function HomeNotices() {
  const [notices, setNotices] = useState(() => getNotices());

  useEffect(() => {
    const refresh = () => setNotices(getNotices());
    let unsubRemote: (() => void) | undefined;
    (async () => {
      await hydrateTipsNoticesFromRemote();
      refresh();
      unsubRemote = subscribeTipsNoticesRemote(refresh);
    })();
    window.addEventListener("storage", refresh);
    window.addEventListener(HOMEPAGE_NOTICES_KEY, refresh);
    const onVisible = () => {
      void hydrateTipsNoticesFromRemote().finally(refresh);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      unsubRemote?.();
      window.removeEventListener("storage", refresh);
      window.removeEventListener(HOMEPAGE_NOTICES_KEY, refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const pinned = notices.filter((n) => n.pinned);
  const firstNonPinned = notices.find((n) => !n.pinned);
  let toShow = [...pinned];
  if (firstNonPinned && !pinned.some((p) => p.id === firstNonPinned.id)) {
    toShow.push(firstNonPinned);
  }
  toShow = toShow.slice(0, 2);

  if (toShow.length === 0) return null;

  return (
    <section className="py-3 md:py-4 bg-mimi-cream rounded-xl border border-stone-100 p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-mimi-charcoal">📌 공지 & 이벤트</h2>
        <Link
          href="/notice"
          prefetch={false}
          className="text-xs text-mimi-primary hover:underline font-medium"
        >
          전체보기 →
        </Link>
      </div>
      <div className="space-y-2">
        {toShow.map((item) => (
          <Link key={item.id} href="/notice" prefetch={false} className="block">
            <NoticeItemCard item={item} />
          </Link>
        ))}
      </div>
    </section>
  );
}
