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
        const url1 = await compressImageFileToJpegDataUrl(file, { maxEdge: 220, quality: 0.65 });
        // dataUrl 길이 기반 대략적인 용량 추정 (더 정확한 bytes 계산은 불필요)
        // 3MB 전후를 넘으면 /api/data 저장이 실패할 확률이 올라갑니다.
        if (url1.length > 4_000_000) {
          const url2 = await compressImageFileToJpegDataUrl(file, { maxEdge: 170, quality: 0.55 });
          if (url2.length > 4_000_000) {
            alert("사진 용량이 너무 커서 저장에 실패할 수 있습니다. 더 작은 사진으로 다시 선택해 주세요.");
            return;
          }
          onChange(url2);
          return;
        }
        onChange(url1);
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
