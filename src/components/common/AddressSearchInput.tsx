"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { address: string; zonecode: string; roadAddress?: string; jibunAddress?: string }) => void;
        width?: string | number;
        height?: string | number;
        maxSuggestItems?: number;
      }) => { open: () => void; embed: (el: HTMLElement) => void };
    };
  }
}

const POSTCODE_SCRIPT = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

type Props = {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
};

function loadPostcodeScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.daum?.Postcode) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${POSTCODE_SCRIPT}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (window.daum?.Postcode) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = POSTCODE_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("postcode script"));
    document.body.appendChild(s);
  });
}

export default function AddressSearchInput({ value, onChange, placeholder = "주소 검색", className = "", inputClassName = "" }: Props) {
  const [mounted, setMounted] = useState(false);
  const [showLayer, setShowLayer] = useState(false);
  const embedRef = useRef<HTMLDivElement>(null);

  const applyAddress = useCallback(
    (data: { address: string; roadAddress?: string; jibunAddress?: string }) => {
      const addr = data.roadAddress || data.jibunAddress || data.address;
      onChange(addr);
    },
    [onChange]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!showLayer || !embedRef.current || typeof window === "undefined" || !window.daum?.Postcode) return;
    const el = embedRef.current;
    el.innerHTML = "";
    const postcode = new window.daum.Postcode({
      width: "100%",
      height: "100%",
      maxSuggestItems: 5,
      oncomplete: (data: { address: string; roadAddress?: string; jibunAddress?: string }) => {
        applyAddress(data);
        setShowLayer(false);
      },
    });
    postcode.embed(el);
    return () => {
      el.innerHTML = "";
    };
  }, [showLayer, applyAddress]);

  const openPostcode = useCallback(async () => {
    try {
      await loadPostcodeScript();
      if (!window.daum?.Postcode) return;

      /*
        모바일: embed()는 부모 높이가 0이 되어 iframe이 안 보이는 경우가 많음 → daum 층 전체 레이어 open() 사용
        데스크톱: 기존 모달 + embed 유지
      */
      /* sm 미만 + 소형 태블릿 세로: embed 높이 이슈 회피 */
      const usePopupLayer = typeof window !== "undefined" && window.innerWidth < 768;

      if (usePopupLayer) {
        new window.daum.Postcode({
          maxSuggestItems: 5,
          oncomplete: (data) => {
            applyAddress(data);
          },
        }).open();
        return;
      }

      setShowLayer(true);
    } catch {
      // eslint-disable-next-line no-alert
      alert("주소 검색을 불러오지 못했습니다. 네트워크를 확인해 주세요.");
    }
  }, [applyAddress]);

  const layer =
    showLayer && mounted ? (
      <div
        className="fixed inset-0 z-[2147483000] flex h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden bg-black/60"
        role="dialog"
        aria-modal="true"
        aria-label="우편번호 검색"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <p className="text-sm font-semibold text-gray-800">주소 검색</p>
          <button
            type="button"
            onClick={() => setShowLayer(false)}
            className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-800 min-h-[44px]"
          >
            닫기
          </button>
        </div>
        <div
          ref={embedRef}
          className="min-h-0 w-full min-w-0 flex-1 overflow-auto bg-white"
          style={{ minHeight: "min(70vh, 520px)" }}
        />
      </div>
    ) : null;

  return (
    <>
      {/*
        모바일: 주소 검색 버튼을 위에 두어( order ) 키보드·스크롤로 아래로 밀린 버튼이 안 보이는 문제 완화
        sm+: 입력 | 버튼 한 줄 (기존과 동일)
      */}
      <div
        className={`flex flex-col sm:flex-row sm:items-stretch gap-3 min-w-0 w-full max-w-full overflow-x-clip box-border ${className}`}
      >
        {/*
          모바일: 주소 검색을 최상단·전체 너비·큰 터치 영역으로 고정 노출 (스크롤에 묻히지 않게)
          sm+: 입력 | 버튼 한 줄
        */}
        <button
          type="button"
          onClick={openPostcode}
          className="order-1 sm:order-2 w-full min-w-0 sm:w-auto sm:shrink-0 inline-flex flex-row items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-3.5 sm:py-3 min-h-[52px] sm:min-h-[48px] text-base bg-mimi-orange text-white rounded-2xl font-bold sm:font-semibold hover:bg-mimi-orange/90 active:bg-mimi-orange/95 shadow-md border-2 border-mimi-orange/80 touch-manipulation select-none"
        >
          <span className="text-lg sm:text-xl shrink-0" aria-hidden>
            📍
          </span>
          <span className="leading-tight text-center [word-break:keep-all]">
            <span className="sm:hidden">우편번호 검색</span>
            <span className="hidden sm:inline">우편번호 · 주소 검색</span>
          </span>
        </button>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`order-2 sm:order-1 w-full min-w-0 flex-1 max-w-full px-3 sm:px-4 py-3 min-h-[48px] sm:min-h-[44px] text-base rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none placeholder:text-gray-400 ${inputClassName}`}
          autoComplete="street-address"
        />
      </div>
      {mounted && typeof document !== "undefined" && layer ? createPortal(layer, document.body) : null}
    </>
  );
}
