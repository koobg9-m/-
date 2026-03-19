/**
 * 로고 이미지에서 노란 배경(#FFE135) 제거 → 투명 PNG 생성
 * node scripts/remove-logo-bg.js
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const INPUT = path.join(__dirname, "../public/mimisalon-logo.png");
const OUTPUT = path.join(__dirname, "../public/mimisalon-logo-transparent.png");

// 노란색 #FFE135 (255, 225, 53)
const TARGET_R = 255;
const TARGET_G = 225;
const TARGET_B = 53;
const TOLERANCE = 45; // 색상 허용 범위 (0~255)

function isYellow(r, g, b) {
  return (
    Math.abs(r - TARGET_R) <= TOLERANCE &&
    Math.abs(g - TARGET_G) <= TOLERANCE &&
    Math.abs(b - TARGET_B) <= TOLERANCE
  );
}

async function main() {
  const { data, info } = await sharp(INPUT)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = new Uint8Array(data);

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (isYellow(r, g, b)) {
      pixels[i + 3] = 0; // alpha = 0 (투명)
    }
  }

  await sharp(pixels, { raw: { width, height, channels } })
    .png()
    .toFile(OUTPUT);

  console.log("Created:", OUTPUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
