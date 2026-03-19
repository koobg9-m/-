/**
 * QR 코드 이미지 API (로고 스타일: 노란 배경, 검정 QR)
 * GET /api/qr → PNG 이미지 반환
 */
import { NextResponse } from "next/server";
import QRCode from "qrcode";

const QR_URL = "https://mimisalon.vercel.app/";

export async function GET() {
  try {
    const png = await QRCode.toBuffer(QR_URL, {
      width: 400,
      margin: 3,
      color: { dark: "#1a1a1a", light: "#FFE135" },
      errorCorrectionLevel: "H",
    });
    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": 'attachment; filename="mimisalon-qr.png"',
      },
    });
  } catch (e) {
    console.error("[api/qr]", e);
    return NextResponse.json({ error: "QR generation failed" }, { status: 500 });
  }
}
