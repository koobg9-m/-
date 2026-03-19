"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const QR_URL = "https://mimisalon.vercel.app/";

export default function QRPage() {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(QR_URL, {
        width: 300,
        margin: 2,
        color: { dark: "#1a1a1a", light: "#FFE135" },
        errorCorrectionLevel: "H",
      }).then(setQrDataUrl);
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FFE135]">
      <div className="bg-[#FFE135] rounded-3xl p-8 shadow-2xl border-4 border-black/10 max-w-sm">
        <div className="flex flex-col items-center mb-4">
          <img
            src="/mimisalon-logo-transparent.png"
            alt="안심방문미용 미미살롱펫"
            className="w-56 h-56 object-contain rounded-xl mb-1"
          />
          <div className="bg-white rounded-2xl p-4 flex justify-center border-2 border-black/10">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="미미살롱펫 QR코드"
                className="w-56 h-56 rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-gray-500">
                로딩 중...
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-black/80 mt-2">
          QR코드를 스캔하면 예약 페이지로 이동합니다
        </p>

        <div className="mt-6 flex gap-3">
          <a
            href="/api/qr"
            download="mimisalon-qr.png"
            className="flex-1 py-3 rounded-xl bg-black text-white font-bold text-center hover:bg-black/90 transition-colors"
          >
            이미지 저장
          </a>
          <Link
            href="/"
            className="flex-1 py-3 rounded-xl bg-white border-2 border-black text-black font-bold text-center hover:bg-black/5 transition-colors"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
