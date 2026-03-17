"use client";

import { useState, useEffect } from "react";
import { getHomepageContent, addSampleHomepageContent } from "@/lib/homepage-content-storage";
import type { ProductLink } from "@/lib/homepage-content-storage";

function ProductLinkCard({ item }: { item: ProductLink }) {
  const [imgError, setImgError] = useState(false);

  if (!item.url?.trim()) return null;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block w-full aspect-[4/3] rounded-xl border border-stone-100 bg-white hover:border-mimi-primary/30 hover:shadow-md transition-all group overflow-hidden"
    >
      {item.imageUrl && !imgError ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={item.imageUrl}
          alt={item.title}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="eager"
          decoding="async"
          draggable={false}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-mimi-primary/10 flex items-center justify-center text-4xl">
          🔗
        </div>
      )}
      <span className="absolute bottom-0 left-0 right-0 text-xs font-medium text-mimi-charcoal group-hover:text-mimi-primary truncate text-center p-2 bg-white/90 backdrop-blur-sm">
        {item.title || "제품"}
      </span>
    </a>
  );
}

const HOMEPAGE_CONTENT_KEY = "mimi_homepage_content";

export default function HomeProductLinks() {
  const [content, setContent] = useState<ReturnType<typeof getHomepageContent> | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = () => {
    setContent(getHomepageContent());
    setLoaded(true);
  };

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === HOMEPAGE_CONTENT_KEY) refresh();
    };
    const onCustom = () => refresh();
    const onVisible = () => refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("mimi_homepage_updated", onCustom);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("mimi_homepage_updated", onCustom);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const links = content?.productLinks ?? [];
  const validLinks = links.filter((p) => p.url?.trim());
  const sorted = [...validLinks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (!loaded) {
    return (
      <section className="py-6 md:py-8 bg-white rounded-2xl border border-stone-100 p-5">
        <div>
          <h2 className="text-base font-bold text-mimi-charcoal mb-5">추천 제품</h2>
          <div className="h-40 rounded-xl bg-stone-100 animate-pulse flex items-center justify-center text-mimi-slate text-sm">
            로딩 중...
          </div>
        </div>
      </section>
    );
  }

  if (sorted.length === 0) {
    return (
      <section className="py-6 md:py-8 bg-white rounded-2xl border border-stone-100 p-5">
        <div>
          <h2 className="text-base font-bold text-mimi-charcoal mb-5">추천 제품</h2>
          <div className="h-40 rounded-xl bg-white border border-stone-100 flex flex-col items-center justify-center gap-2 text-mimi-slate text-sm p-4">
            <p>관리자 페이지에서 제품 링크를 추가해 주세요</p>
            <p className="text-xs">추가 후 <a href="/admin" className="text-mimi-orange underline">관리자 → 홈페이지</a> 탭에서 등록</p>
            <p className="text-xs text-amber-700">※ localhost와 127.0.0.1은 다른 저장소입니다. 같은 주소로 접속하세요.</p>
            <div className="flex gap-3 mt-2">
              <button onClick={refresh} className="text-xs px-3 py-1.5 bg-stone-200 rounded-lg hover:bg-stone-300">새로고침</button>
              <button
                onClick={() => {
                  addSampleHomepageContent();
                  refresh();
                }}
                className="text-xs px-3 py-1.5 bg-mimi-orange text-white rounded-lg hover:bg-mimi-orange/90"
              >
                테스트 데이터 로드
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6 md:py-8 bg-white rounded-2xl border border-stone-100 p-5 flex flex-col h-full">
      <div className="flex flex-col flex-1 min-h-0">
        <h2 className="text-base font-bold text-mimi-charcoal mb-5 shrink-0">추천 제품</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {sorted.map((item) => (
            <ProductLinkCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
