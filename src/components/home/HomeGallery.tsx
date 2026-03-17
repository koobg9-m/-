"use client";

import { useState, useEffect, useCallback } from "react";
import { getHomepageContent, addSampleHomepageContent } from "@/lib/homepage-content-storage";
import type { GalleryItem } from "@/lib/homepage-content-storage";

/** YouTube watch URL → embed URL 변환 */
function toEmbedUrl(url: string): string {
  const trimmed = url.trim();
  const match = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}`;
  return trimmed;
}

function GallerySlide({ item }: { item: GalleryItem }) {
  const [imgError, setImgError] = useState(false);
  const isDataUrl = item.url.startsWith("data:");
  const embedUrl = item.type === "video" && !isDataUrl ? toEmbedUrl(item.url) : item.url;

  if (!embedUrl) {
    return (
      <div className="absolute inset-0 rounded-xl bg-stone-100 flex items-center justify-center text-mimi-slate">
        URL 없음
      </div>
    );
  }

  if (item.type === "image") {
    return (
      <div className="absolute inset-0 rounded-xl overflow-hidden bg-stone-100">
        {imgError ? (
          <div className="absolute inset-0 flex items-center justify-center text-5xl bg-stone-100">🖼️</div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={embedUrl}
            alt={item.title ?? "갤러리"}
            className="absolute inset-0 w-full h-full object-contain object-center"
            loading="eager"
            decoding="async"
            draggable={false}
            onError={() => setImgError(true)}
          />
        )}
      </div>
    );
  }

  if (isDataUrl) {
    return (
      <div className="absolute inset-0 rounded-xl overflow-hidden bg-stone-900">
        <video
          src={embedUrl}
          controls
          className="w-full h-full object-contain object-center"
          playsInline
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 rounded-xl overflow-hidden bg-stone-200">
      <iframe
        src={embedUrl}
        title={item.title ?? "영상"}
        className="absolute inset-0 w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

const HOMEPAGE_CONTENT_KEY = "mimi_homepage_content";

export default function HomeGallery() {
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

  const gallery = content?.gallery ?? [];
  const validGallery = gallery.filter((g) => g.url?.trim());
  const sorted = [...validGallery].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const total = sorted.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const goPrev = useCallback(() => setCurrentIndex((i) => (i <= 0 ? total - 1 : i - 1)), [total]);
  const goNext = useCallback(() => setCurrentIndex((i) => (i >= total - 1 ? 0 : i + 1)), [total]);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
    setTouchStart(null);
  };

  useEffect(() => {
    setCurrentIndex(0);
  }, [total]);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(goNext, 4000);
    return () => clearInterval(id);
  }, [total, goNext]);

  if (!loaded) {
    return (
      <section className="py-6 md:py-8 bg-white rounded-2xl border border-stone-100 p-5">
        <div>
          <h2 className="text-base font-bold text-mimi-charcoal mb-5">갤러리</h2>
          <div className="h-40 rounded-xl bg-stone-100 animate-pulse flex items-center justify-center text-mimi-slate text-sm">
            로딩 중...
          </div>
        </div>
      </section>
    );
  }

  if (total === 0) {
    return (
      <section className="py-6 md:py-8 bg-white rounded-2xl border border-stone-100 p-5">
        <div>
          <h2 className="text-base font-bold text-mimi-charcoal mb-5">갤러리</h2>
          <div className="h-40 rounded-xl bg-stone-100 flex flex-col items-center justify-center gap-2 text-mimi-slate text-sm p-4">
            <p>관리자 페이지에서 강아지 사진과 영상을 추가해 주세요</p>
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

  const currentItem = sorted[currentIndex];

  return (
    <section className="py-6 md:py-8 bg-white rounded-2xl border border-stone-100 p-5 flex flex-col h-full min-h-[166px] md:min-h-[192px]">
      <div className="flex flex-col flex-1 min-h-0">
        <h2 className="text-base font-bold text-mimi-charcoal mb-5 shrink-0">갤러리</h2>
        <div
          className="relative touch-pan-y flex-1 min-h-[102px] sm:min-h-[128px] md:min-h-[154px] aspect-video max-h-[218px]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative overflow-hidden rounded-xl bg-stone-100 w-full h-full min-h-[102px] sm:min-h-[128px] md:min-h-[154px]">
            {currentItem && (
              <div key={currentItem.id} className="absolute inset-0 w-full h-full transition-opacity duration-300">
                <GallerySlide item={currentItem} />
              </div>
            )}
          </div>
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors text-2xl leading-none"
                aria-label="이전"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors text-2xl leading-none"
                aria-label="다음"
              >
                ›
              </button>
              <div className="flex justify-center gap-1.5 mt-3">
                {sorted.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === currentIndex ? "bg-mimi-orange" : "bg-stone-300 hover:bg-stone-400"}`}
                    aria-label={`${i + 1}번째`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
