"use client";

import { useCallback, type ChangeEvent } from "react";
import { compressImageFileToJpegDataUrl } from "@/lib/image-compress";

export type GroomerProfilePhotoInputProps = {
  value: string;
  onChange: (dataUrl: string) => void;
  /** 기본: 프로필 사진 (고객 예약 화면에 공개) */
  label?: string;
  hint?: string;
  chooseLabel?: string;
  className?: string;
  previewClassName?: string;
};

/**
 * 디자이너 신청·프로필 수정 등에서 동일한 사진 입력 UX (압축·미리보기·삭제)
 */
export default function GroomerProfilePhotoInput({
  value,
  onChange,
  label = "프로필 사진 (고객 예약 화면에 공개)",
  hint = "이름·나이·경력·소개와 함께 표시됩니다.",
  chooseLabel = "사진 선택",
  className = "",
  previewClassName = "w-24 h-24 rounded-full object-cover border-2 border-gray-100",
}: GroomerProfilePhotoInputProps) {
  const handleFile = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        // eslint-disable-next-line no-alert
        alert("이미지 파일만 선택할 수 있습니다.");
        return;
      }
      try {
        // 업로드 데이터 용량이 커서 Supabase 저장이 실패하는 케이스를 줄이기 위해
        // 기본보다 더 공격적으로 리사이즈/압축합니다.
        const url = await compressImageFileToJpegDataUrl(file, { maxEdge: 260, quality: 0.72 });
        onChange(url);
      } catch {
        // eslint-disable-next-line no-alert
        alert("사진을 처리하지 못했습니다. 다른 파일을 선택해 주세요.");
      }
    },
    [onChange]
  );

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint ? <p className="text-xs text-gray-500 mb-2">{hint}</p> : null}
      <label className="flex flex-col items-center justify-center w-full min-h-[52px] px-4 py-3 rounded-xl border-2 border-dashed border-mimi-orange/40 bg-mimi-orange/5 text-mimi-orange text-sm font-medium cursor-pointer touch-manipulation">
        <span>{chooseLabel}</span>
        <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
      </label>
      {value ? (
        <div className="mt-3 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={previewClassName} />
          <button type="button" onClick={() => onChange("")} className="text-sm text-red-600 hover:underline shrink-0">
            사진 삭제
          </button>
        </div>
      ) : null}
    </div>
  );
}
