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
        const addr = data.roadAddress || data.jibunAddress || data.address;
        onChange(addr);
        setShowLayer(false);
      },
    });
    postcode.embed(el);
    return () => {
      el.innerHTML = "";
    };
  }, [showLayer, onChange]);

  const openPostcode = useCallback(async () => {
    try {
      await loadPostcodeScript();
      if (!window.daum?.Postcode) return;
      setShowLayer(true);
    } catch {
      // eslint-disable-next-line no-alert
      alert("주소 검색을 불러오지 못했습니다. 네트워크를 확인해 주세요.");
    }
  }, []);

  const layer =
    showLayer && mounted ? (
      <div
        className="fixed inset-0 z-[10000] flex flex-col bg-black/60"
        role="dialog"
        aria-modal="true"
        aria-label="우편번호 검색"
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
        <div ref={embedRef} className="min-h-0 flex-1 w-full min-w-0 overflow-auto bg-white" />
      </div>
    ) : null;

  return (
    <>
      <div className={`flex flex-col sm:flex-row gap-2 min-w-0 max-w-full ${className}`}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full min-w-0 flex-1 px-3 sm:px-4 py-3 min-h-[44px] text-base rounded-xl border-2 border-gray-200 focus:border-mimi-orange outline-none ${inputClassName}`}
          autoComplete="street-address"
        />
        <button
          type="button"
          onClick={openPostcode}
          className="w-full sm:w-auto shrink-0 px-4 sm:px-5 py-3 min-h-[44px] text-base bg-mimi-orange text-white rounded-xl font-medium hover:bg-mimi-orange/90 whitespace-nowrap"
        >
          주소 검색
        </button>
      </div>
      {mounted && typeof document !== "undefined" && layer ? createPortal(layer, document.body) : null}
    </>
  );
}
