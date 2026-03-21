"use client";

import { useCallback } from "react";

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: { address: string; zonecode: string; roadAddress?: string; jibunAddress?: string }) => void;
      }) => { open: () => void };
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

export default function AddressSearchInput({ value, onChange, placeholder = "주소 검색", className = "", inputClassName = "" }: Props) {
  const openPostcode = useCallback(() => {
    const run = () => {
      if (typeof window === "undefined" || !window.daum?.Postcode) return;
      new window.daum.Postcode({
        oncomplete: (data: { address: string; roadAddress?: string; jibunAddress?: string }) => {
          const addr = data.roadAddress || data.jibunAddress || data.address;
          onChange(addr);
        },
      }).open();
    };

    if (window.daum?.Postcode) {
      run();
      return;
    }
    const script = document.querySelector(`script[src="${POSTCODE_SCRIPT}"]`) as HTMLScriptElement | null;
    if (script) {
      script.onload = () => run();
      if (window.daum?.Postcode) run();
      return;
    }
    const newScript = document.createElement("script");
    newScript.src = POSTCODE_SCRIPT;
    newScript.async = true;
    newScript.onload = () => run();
    document.body.appendChild(newScript);
  }, [onChange]);

  return (
    <div className={`flex flex-col sm:flex-row gap-2 min-w-0 ${className}`}>
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
  );
}
